# Tangabiz POS System - Overview

## Introduction

Tangabiz is a modern Point of Sale (POS) system designed specifically for Small and Medium Enterprises (SMEs) in Zimbabwe. The platform offers intermediate POS features with subscription-based pricing in USD.

## Target Market

- Small and Medium Enterprises (SMEs) in Zimbabwe
- Retail shops, restaurants, service businesses
- Businesses looking for affordable, reliable POS solutions

## Business Model

### Subscription-Based Pricing

All plans include a **3-day free trial** to allow businesses to test the platform before committing.

| Plan | Price | Receipts/Month | Customers | Users/Location | Features |
|------|-------|----------------|-----------|----------------|----------|
| **Basic** | $19.99/month | 500 | 500 | 1 | Core POS, Sales Tracking, Limited Analytics |
| **Pro** | $49.99/month | 2,000 | 2,000 | 2 | Full Analytics, Customer Management |
| **Premium** | $89.99/month | Unlimited | Unlimited | 5 | Advanced Reporting, Integrations |

### Plan Details

#### Basic Plan ($19.99/month)
- Up to 500 receipts per month
- Up to 500 customers in database
- 1 user per location
- Core POS functionality
- Sales tracking
- Analytics & customer management (limited views)
- "Upgrade" overlay on advanced insights

#### Pro Plan ($49.99/month)
- Up to 2,000 receipts per month
- Up to 2,000 customers in database
- 2 users per location
- Full analytics dashboard
- Complete customer management
- All Basic features unlocked

#### Premium Plan ($89.99/month)
- Unlimited receipts
- Unlimited customers
- 5 users per location
- Advanced reporting
- Third-party integrations
- Priority support
- All Pro features included

## Tech Stack

- **Frontend**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Authentication**: Better-Auth with Prisma
- **Database**: PostgreSQL with Prisma ORM
- **Payments**: PayNow Zimbabwe
- **Deployment**: TBD

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── onboarding/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── sales/
│   │   ├── customers/
│   │   ├── reports/
│   │   ├── analytics/
│   │   ├── settings/
│   │   └── billing/
│   ├── api/
│   │   └── auth/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── auth/
│   ├── dashboard/
│   ├── sales/
│   ├── customers/
│   └── shared/
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   └── utils.ts
└── types/
```

## Key Features Summary

1. **Authentication & Authorization** - Magic link login, organization-based access
2. **Sales Tracking** - Receipt generation, transaction history
3. **Customer Management** - Customer database, purchase history
4. **Analytics & Reports** - Sales insights, business metrics
5. **Subscription Management** - Plan upgrades, billing via PayNow
