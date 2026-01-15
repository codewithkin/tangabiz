# CVT Integration Guide for Tangabiz

## Overview
This guide explains how to integrate CVT authentication and billing into your business management system.

## Architecture

### Two-Tier Authentication

1. **Business Level (CVT API Keys)**
   - Businesses authenticate using CVT API keys
   - Used for billing, subscription management, and business setup
   - Business owner gets API key from CVT dashboard

2. **User Level (Email/Password)**
   - Individual staff members within each business
   - Managed through your existing Better Auth system
   - No CVT interaction for regular users

## Implementation Flow

### 1. Business Registration Flow

```typescript
// app/api/business/register/route.ts

import { prisma } from '@/lib/prisma';
import { verifyCVTApiKey, createCVTCustomer } from '@/lib/cvt';
import crypto from 'crypto';

export async function POST(req: Request) {
  const { cvtApiKey, businessName, email } = await req.json();
  
  // Step 1: Verify CVT API key
  const cvtCustomer = await verifyCVTApiKey(cvtApiKey);
  
  if (!cvtCustomer) {
    return Response.json({ error: 'Invalid CVT API key' }, { status: 401 });
  }
  
  // Step 2: Create business with CVT details
  const business = await prisma.business.create({
    data: {
      name: businessName,
      slug: generateSlug(businessName),
      email: email,
      billingEmail: email,
      cvtCustomerId: cvtCustomer.id,
      cvtApiKey: await encryptApiKey(cvtApiKey), // Encrypt before storing
      cvtApiKeyHash: hashApiKey(cvtApiKey),
      cvtSubscriptionStatus: cvtCustomer.subscription?.status || 'active',
      subscriptionPlan: cvtCustomer.subscription?.plan || 'basic',
      trialEndsAt: cvtCustomer.trialEndsAt,
    },
  });
  
  // Step 3: Generate internal API keys for the business
  const apiKey = generateApiKey(); // e.g., tb_live_abc123xyz...
  
  await prisma.apiKey.create({
    data: {
      name: 'Production',
      keyPrefix: apiKey.prefix, // First 8 chars
      keyHash: hashApiKey(apiKey.full),
      businessId: business.id,
    },
  });
  
  return Response.json({
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
    },
    apiKey: apiKey.full, // Only shown once!
  });
}
```

### 2. API Key Authentication Middleware

```typescript
// lib/auth/api-key.ts

import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';
import { NextRequest } from 'next/server';

export async function authenticateApiKey(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key') || 
                 req.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!apiKey) {
    return { error: 'API key required', status: 401 };
  }
  
  // Hash the provided key
  const keyHash = createHash('sha256').update(apiKey).digest('hex');
  
  // Look up in database
  const apiKeyRecord = await prisma.apiKey.findFirst({
    where: {
      keyHash,
      isActive: true,
    },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
          cvtSubscriptionStatus: true,
          subscriptionEndsAt: true,
          isActive: true,
        },
      },
    },
  });
  
  if (!apiKeyRecord) {
    return { error: 'Invalid API key', status: 401 };
  }
  
  // Check if API key expired
  if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
    return { error: 'API key expired', status: 401 };
  }
  
  // Check subscription status
  if (apiKeyRecord.business.cvtSubscriptionStatus !== 'active') {
    return { error: 'Subscription inactive', status: 403 };
  }
  
  // Check subscription expiration
  if (apiKeyRecord.business.subscriptionEndsAt && 
      apiKeyRecord.business.subscriptionEndsAt < new Date()) {
    return { error: 'Subscription expired', status: 403 };
  }
  
  // Update last used timestamp
  await prisma.apiKey.update({
    where: { id: apiKeyRecord.id },
    data: { lastUsedAt: new Date() },
  });
  
  return {
    business: apiKeyRecord.business,
    apiKey: apiKeyRecord,
  };
}
```

### 3. CVT Webhook Handler

```typescript
// app/api/webhooks/cvt/route.ts

import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/cvt';

export async function POST(req: Request) {
  const signature = req.headers.get('cvt-signature');
  const body = await req.text();
  
  // Verify webhook is from CVT
  if (!verifyWebhookSignature(body, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  const event = JSON.parse(body);
  
  switch (event.type) {
    case 'charge.succeeded':
      await handleChargeSucceeded(event);
      break;
      
    case 'charge.failed':
      await handleChargeFailed(event);
      break;
      
    case 'subscription.updated':
      await handleSubscriptionUpdated(event);
      break;
      
    case 'subscription.canceled':
      await handleSubscriptionCanceled(event);
      break;
  }
  
  return Response.json({ received: true });
}

async function handleChargeSucceeded(event: any) {
  const business = await prisma.business.findUnique({
    where: { cvtCustomerId: event.data.customer_id },
  });
  
  if (!business) return;
  
  // Update business billing status
  await prisma.business.update({
    where: { id: business.id },
    data: {
      lastBilledAt: new Date(),
      cvtSubscriptionStatus: 'active',
    },
  });
  
  // Log billing event
  await prisma.billingEvent.create({
    data: {
      businessId: business.id,
      type: 'charge_succeeded',
      amount: event.data.amount,
      currency: event.data.currency,
      status: 'succeeded',
      cvtEventId: event.id,
      cvtCustomerId: event.data.customer_id,
      metadata: event.data,
    },
  });
}

async function handleChargeFailed(event: any) {
  const business = await prisma.business.findUnique({
    where: { cvtCustomerId: event.data.customer_id },
  });
  
  if (!business) return;
  
  // Update subscription status
  await prisma.business.update({
    where: { id: business.id },
    data: {
      cvtSubscriptionStatus: 'past_due',
    },
  });
  
  // Log event
  await prisma.billingEvent.create({
    data: {
      businessId: business.id,
      type: 'charge_failed',
      amount: event.data.amount,
      currency: event.data.currency,
      status: 'failed',
      cvtEventId: event.id,
      cvtCustomerId: event.data.customer_id,
      errorMessage: event.data.error_message,
      metadata: event.data,
    },
  });
  
  // TODO: Send notification to business owner
}

async function handleSubscriptionCanceled(event: any) {
  const business = await prisma.business.findUnique({
    where: { cvtCustomerId: event.data.customer_id },
  });
  
  if (!business) return;
  
  await prisma.business.update({
    where: { id: business.id },
    data: {
      cvtSubscriptionStatus: 'canceled',
      isActive: false,
      subscriptionEndsAt: new Date(event.data.ends_at),
    },
  });
}
```

### 4. CVT Service Integration

```typescript
// lib/cvt/client.ts

const CVT_API_URL = process.env.CVT_API_URL;
const CVT_SECRET_KEY = process.env.CVT_SECRET_KEY;

export async function verifyAPIKey(apiKey: string) {
  const response = await fetch(`${CVT_API_URL}/v1/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CVT_SECRET_KEY}`,
    },
    body: JSON.stringify({ api_key: apiKey }),
  });
  
  if (!response.ok) return null;
  
  return await response.json();
}

export async function createCVTCustomer(data: {
  email: string;
  name: string;
  plan: string;
}) {
  const response = await fetch(`${CVT_API_URL}/v1/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CVT_SECRET_KEY}`,
    },
    body: JSON.stringify(data),
  });
  
  return await response.json();
}

export async function chargeCustomer(customerId: string, amount: number) {
  const response = await fetch(`${CVT_API_URL}/v1/charges`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CVT_SECRET_KEY}`,
    },
    body: JSON.stringify({
      customer_id: customerId,
      amount,
      currency: 'USD',
      description: 'Monthly subscription',
    }),
  });
  
  return await response.json();
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', process.env.CVT_WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### 5. Cron Job for Monthly Billing

```typescript
// app/api/cron/billing/route.ts

import { prisma } from '@/lib/prisma';
import { chargeCustomer } from '@/lib/cvt/client';

export async function GET(req: Request) {
  // Verify cron secret
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Find businesses due for billing
  const businesses = await prisma.business.findMany({
    where: {
      isActive: true,
      cvtSubscriptionStatus: 'active',
      OR: [
        { lastBilledAt: null },
        { lastBilledAt: { lte: oneMonthAgo } },
      ],
    },
  });
  
  const results = [];
  
  for (const business of businesses) {
    try {
      const planPrices = {
        basic: 2999, // $29.99
        pro: 4999,
        enterprise: 9999,
      };
      
      const amount = planPrices[business.subscriptionPlan as keyof typeof planPrices] || 2999;
      
      const charge = await chargeCustomer(business.cvtCustomerId!, amount);
      
      if (charge.status === 'succeeded') {
        await prisma.business.update({
          where: { id: business.id },
          data: { lastBilledAt: now },
        });
        
        results.push({ businessId: business.id, status: 'success' });
      } else {
        results.push({ businessId: business.id, status: 'failed', error: charge.error });
      }
    } catch (error) {
      results.push({ businessId: business.id, status: 'error', error });
    }
  }
  
  return Response.json({ processed: businesses.length, results });
}
```

## Environment Variables

Add these to your `.env`:

```env
# CVT Integration
CVT_API_URL=https://api.cvt.com
CVT_SECRET_KEY=your_cvt_secret_key
CVT_WEBHOOK_SECRET=your_webhook_secret

# Cron
CRON_SECRET=your_cron_secret
```

## Migration Steps

1. **Update schema.prisma** with the new fields and models
2. **Run migration**: `npx prisma migrate dev --name add_cvt_integration`
3. **Update environment variables**
4. **Deploy webhook handler** to `/api/webhooks/cvt`
5. **Configure CVT webhook** to point to your endpoint
6. **Set up cron job** for monthly billing (Vercel Cron or similar)

## User Flows

### Business Owner Setup
1. Signs up on CVT platform → receives CVT API key
2. Goes to your app's registration page
3. Enters CVT API key + business details
4. System verifies CVT key and creates business
5. Receives internal API key for accessing your API

### Staff Member Login
1. Business owner invites staff via email
2. Staff creates account with email/password (Better Auth)
3. Staff logs in normally - no CVT interaction needed

### API Access (Mobile App / Integrations)
1. Use internal API key in request headers
2. System validates key and checks subscription status
3. If active, allow request

## Security Best Practices

1. **Encrypt CVT API keys** before storing in database
2. **Hash internal API keys** - only store hashes
3. **Use HTTPS** for all CVT communication
4. **Verify webhook signatures** to prevent spoofing
5. **Rate limit** API key endpoints
6. **Rotate keys** periodically
7. **Log all billing events** for audit trail

## Testing

1. **Use CVT test mode** during development
2. **Test webhook handlers** with CVT CLI or webhook.site
3. **Mock billing failures** to test error handling
4. **Verify subscription checks** work correctly
5. **Test API key expiration** logic
