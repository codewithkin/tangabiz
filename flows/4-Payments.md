# Tangabiz - Payments & Billing

## Overview

Tangabiz uses **PayNow Zimbabwe** for subscription payments. All pricing is in USD.

## Payment Provider

### PayNow Zimbabwe
- Local payment gateway for Zimbabwe
- Supports EcoCash, OneMoney, and bank transfers
- USD payments supported
- Integration documentation: TBD

---

## Subscription Plans

### Pricing Table

| Plan | Monthly Price | Annual Price (Save 15%) |
|------|---------------|------------------------|
| **Basic** | $19.99/month | $203.90/year ($16.99/mo) |
| **Pro** | $49.99/month | $509.90/year ($42.49/mo) |
| **Premium** | $89.99/month | $917.90/year ($76.49/mo) |

### Free Trial
- **Duration**: 3 days
- **Plan**: Full Pro features during trial
- **No payment required** to start trial
- **Payment required** after trial ends

---

## Billing Flow

### New Business Owner

```
┌─────────────────────────────────────────────────────────────┐
│                    Onboarding Complete                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Select a Plan                              │
│                                                              │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐                │
│   │  Basic  │    │   Pro   │    │ Premium │                │
│   │ $19.99  │    │ $49.99  │    │ $89.99  │                │
│   └─────────┘    └─────────┘    └─────────┘                │
│                                                              │
│            [ Start 3-Day Free Trial ]                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              3-Day Free Trial Activated                      │
│              (Pro features unlocked)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                     After 3 days
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Trial Expired Modal                         │
│                                                              │
│   "Your free trial has ended. Subscribe to continue."        │
│                                                              │
│            [ Subscribe Now via PayNow ]                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  PayNow Payment Page                         │
│                                                              │
│   Payment Methods:                                           │
│   - EcoCash                                                  │
│   - OneMoney                                                 │
│   - Bank Transfer                                            │
│   - Visa/Mastercard                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                     Subscription Active
```

---

## Subscription Data Model

```prisma
model Subscription {
  id             String           @id @default(cuid())
  organizationId String           @unique
  plan           Plan             @default(BASIC)
  status         SubscriptionStatus @default(TRIALING)
  
  trialEndsAt    DateTime?
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  
  // PayNow specific fields
  paynowReference    String?
  lastPaymentDate    DateTime?
  lastPaymentAmount  Decimal?     @db.Decimal(10, 2)
  
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  
  organization   Organization     @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  payments       Payment[]
}

model Payment {
  id             String        @id @default(cuid())
  subscriptionId String
  amount         Decimal       @db.Decimal(10, 2)
  currency       String        @default("USD")
  status         PaymentStatus @default(PENDING)
  paymentMethod  String?       // ecocash, onemoney, bank, card
  paynowPollUrl  String?
  paynowReference String?
  
  createdAt      DateTime      @default(now())
  paidAt         DateTime?
  
  subscription   Subscription  @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
}

enum Plan {
  BASIC
  PRO
  PREMIUM
}

enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
  EXPIRED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}
```

---

## Usage Tracking

### Limits by Plan

| Metric | Basic | Pro | Premium |
|--------|-------|-----|---------|
| Receipts/month | 500 | 2,000 | Unlimited |
| Customers | 500 | 2,000 | Unlimited |
| Users/location | 1 | 2 | 5 |

### Usage Model

```prisma
model UsageRecord {
  id             String       @id @default(cuid())
  organizationId String
  metric         UsageMetric
  count          Int          @default(0)
  periodStart    DateTime
  periodEnd      DateTime
  
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@unique([organizationId, metric, periodStart])
}

enum UsageMetric {
  RECEIPTS
  CUSTOMERS
  USERS
}
```

### Usage Warnings

- **80% threshold**: Warning banner shown
- **100% threshold**: Feature blocked, upgrade prompt
- **Reset**: Monthly on billing cycle date

---

## Billing Page Components

- [ ] BillingDashboard - Overview of subscription
- [ ] CurrentPlan - Display current plan details
- [ ] UsageMetrics - Show usage vs limits
- [ ] PlanComparison - Compare all plans
- [ ] UpgradeModal - Plan upgrade flow
- [ ] PaymentHistory - List of past payments
- [ ] PaymentMethodManager - Saved payment methods
- [ ] InvoiceDownload - Download invoices

---

## Upgrade Flow

### From Basic to Pro/Premium

1. User clicks "Upgrade" from billing page or upgrade overlay
2. Plan comparison modal appears
3. User selects new plan
4. Redirected to PayNow checkout
5. On success, plan upgraded immediately
6. Prorated billing applied

### From Pro to Premium

Same flow as above with prorated billing.

### Downgrade

1. User requests downgrade from billing page
2. Confirmation modal (warns about feature loss)
3. Downgrade scheduled for end of current period
4. Features remain until period ends

---

## Trial Management

### Trial States

```
TRIALING (Day 1-3)
    │
    ├── User subscribes → ACTIVE
    │
    └── Trial expires → EXPIRED
              │
              └── User subscribes → ACTIVE
```

### Trial Expired Behavior

- Dashboard shows trial expired modal
- Can still view data (read-only)
- Cannot process new sales
- Must subscribe to continue

---

## Implementation Notes

### PayNow Integration (TODO)

```typescript
// Placeholder for PayNow integration
interface PayNowConfig {
  integrationId: string;
  integrationKey: string;
  resultUrl: string;
  returnUrl: string;
}

// Payment initiation
async function initiatePayment(subscription: Subscription, plan: Plan) {
  // TODO: Implement PayNow payment initiation
}

// Payment verification
async function verifyPayment(pollUrl: string) {
  // TODO: Implement PayNow payment verification
}
```

### Webhook Handling

- Set up endpoint for PayNow callbacks
- Update subscription status on payment confirmation
- Handle failed payments with retry logic

---

## Security Considerations

- Store PayNow credentials in environment variables
- Validate all webhook signatures
- Use HTTPS for all payment endpoints
- Log all payment transactions
- PCI compliance considerations for card payments
