# Tangabiz - Features

## Overview

This document outlines the core features of Tangabiz POS system, including Customer Management, Sales Tracking, Reports, and Analytics.

---

## 1. Customer Management

### Description
Manage customer information, track purchase history, and build customer relationships.

### Features by Plan

| Feature | Basic | Pro | Premium |
|---------|-------|-----|---------|
| Customer database | ✅ (500 max) | ✅ (2,000 max) | ✅ (Unlimited) |
| Add/Edit customers | ✅ | ✅ | ✅ |
| View purchase history | ✅ | ✅ | ✅ |
| Customer search | ✅ | ✅ | ✅ |
| Customer segments | 🔒 Upgrade | ✅ | ✅ |
| Customer insights | 🔒 Upgrade | ✅ | ✅ |
| Export customers | 🔒 Upgrade | ✅ | ✅ |
| Bulk import | 🔒 Upgrade | 🔒 Upgrade | ✅ |

### Customer Data Model

```prisma
model Customer {
  id             String       @id @default(cuid())
  name           String
  email          String?
  phone          String?
  address        String?
  notes          String?
  organizationId String
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  sales          Sale[]
  
  @@unique([email, organizationId])
  @@unique([phone, organizationId])
}
```

### UI Components

- [ ] CustomerList - Table/grid of customers
- [ ] CustomerForm - Add/edit customer modal
- [ ] CustomerDetail - Customer profile page
- [ ] CustomerSearch - Search and filter component
- [ ] UpgradeOverlay - Shown on locked features (Basic plan)

---

## 2. Sales Tracking

### Description
Core POS functionality for processing sales, generating receipts, and tracking transactions.

### Features by Plan

| Feature | Basic | Pro | Premium |
|---------|-------|-----|---------|
| Process sales | ✅ (500/month) | ✅ (2,000/month) | ✅ (Unlimited) |
| Generate receipts | ✅ | ✅ | ✅ |
| Receipt printing | ✅ | ✅ | ✅ |
| Transaction history | ✅ | ✅ | ✅ |
| Refunds/returns | ✅ | ✅ | ✅ |
| Multiple payment methods | ✅ | ✅ | ✅ |
| Discount application | ✅ | ✅ | ✅ |
| Sales notes | ✅ | ✅ | ✅ |
| Void transactions | 🔒 Manager+ | ✅ | ✅ |
| Batch operations | 🔒 Upgrade | 🔒 Upgrade | ✅ |

### Receipt Limits

- **Basic**: 500 receipts/month (warning at 80%, blocked at 100%)
- **Pro**: 2,000 receipts/month (warning at 80%, blocked at 100%)
- **Premium**: Unlimited

### Sales Data Model

```prisma
model Sale {
  id             String       @id @default(cuid())
  receiptNumber  String       @unique
  subtotal       Decimal      @db.Decimal(10, 2)
  discount       Decimal      @default(0) @db.Decimal(10, 2)
  tax            Decimal      @default(0) @db.Decimal(10, 2)
  total          Decimal      @db.Decimal(10, 2)
  paymentMethod  PaymentMethod
  status         SaleStatus   @default(COMPLETED)
  notes          String?
  
  customerId     String?
  organizationId String
  userId         String       // Staff who processed
  
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  
  customer       Customer?    @relation(fields: [customerId], references: [id])
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id])
  items          SaleItem[]
}

model SaleItem {
  id          String   @id @default(cuid())
  saleId      String
  productName String
  quantity    Int
  unitPrice   Decimal  @db.Decimal(10, 2)
  total       Decimal  @db.Decimal(10, 2)
  
  sale        Sale     @relation(fields: [saleId], references: [id], onDelete: Cascade)
}

enum PaymentMethod {
  CASH
  CARD
  MOBILE_MONEY
  BANK_TRANSFER
  OTHER
}

enum SaleStatus {
  COMPLETED
  REFUNDED
  VOIDED
  PENDING
}
```

### UI Components

- [ ] POSTerminal - Main sales interface
- [ ] Cart - Current transaction items
- [ ] PaymentModal - Payment processing
- [ ] ReceiptPreview - Receipt before printing
- [ ] ReceiptPrint - Printable receipt format
- [ ] TransactionHistory - List of past sales
- [ ] RefundModal - Process refunds
- [ ] UsageWarning - Receipt limit warning banner

---

## 3. Reports

### Description
Generate business reports for sales, inventory, and staff performance.

### Features by Plan

| Feature | Basic | Pro | Premium |
|---------|-------|-----|---------|
| Daily sales summary | ✅ | ✅ | ✅ |
| Weekly sales report | ✅ | ✅ | ✅ |
| Monthly sales report | 🔒 Upgrade | ✅ | ✅ |
| Custom date range | 🔒 Upgrade | ✅ | ✅ |
| Product performance | 🔒 Upgrade | ✅ | ✅ |
| Staff performance | 🔒 Upgrade | ✅ | ✅ |
| Customer reports | 🔒 Upgrade | ✅ | ✅ |
| Export to PDF | 🔒 Upgrade | ✅ | ✅ |
| Export to Excel | 🔒 Upgrade | 🔒 Upgrade | ✅ |
| Scheduled reports | 🔒 Upgrade | 🔒 Upgrade | ✅ |
| Custom reports | 🔒 Upgrade | 🔒 Upgrade | ✅ |

### Report Types

1. **Sales Reports**
   - Daily/Weekly/Monthly summaries
   - Sales by payment method
   - Sales by time of day
   - Top selling products

2. **Customer Reports**
   - New vs returning customers
   - Top customers by spend
   - Customer acquisition

3. **Staff Reports** (Manager+ only)
   - Sales by staff member
   - Transaction counts
   - Average transaction value

### UI Components

- [ ] ReportsDashboard - Overview of available reports
- [ ] ReportViewer - Display generated reports
- [ ] DateRangePicker - Select report period
- [ ] ReportExport - Export options modal
- [ ] UpgradeOverlay - Shown on locked reports

---

## 4. Analytics

### Description
Visual insights and metrics to help business owners make data-driven decisions.

### Features by Plan

| Feature | Basic | Pro | Premium |
|---------|-------|-----|---------|
| Today's sales | ✅ | ✅ | ✅ |
| Basic charts | ✅ | ✅ | ✅ |
| Revenue trends | 🔒 Upgrade | ✅ | ✅ |
| Sales forecasting | 🔒 Upgrade | 🔒 Upgrade | ✅ |
| Customer analytics | 🔒 Upgrade | ✅ | ✅ |
| Product analytics | 🔒 Upgrade | ✅ | ✅ |
| Comparative analysis | 🔒 Upgrade | 🔒 Upgrade | ✅ |
| Real-time dashboard | 🔒 Upgrade | 🔒 Upgrade | ✅ |

### Analytics Dashboard Widgets

#### Basic Plan (Limited)
- Today's Sales (number)
- Today's Transactions (count)
- Simple bar chart (last 7 days)
- **Upgrade overlay** on advanced widgets

#### Pro Plan
- Revenue trends (line chart)
- Sales by payment method (pie chart)
- Top products (bar chart)
- Customer growth (line chart)
- Hourly sales pattern (heatmap)

#### Premium Plan
- All Pro features
- Sales forecasting
- Year-over-year comparison
- Custom widget arrangement
- Real-time updates

### UI Components

- [ ] AnalyticsDashboard - Main analytics page
- [ ] MetricCard - Single metric display
- [ ] SalesChart - Revenue/sales line chart
- [ ] PaymentMethodChart - Pie chart breakdown
- [ ] TopProductsChart - Bar chart
- [ ] CustomerGrowthChart - Line chart
- [ ] ForecastWidget - Predictive analytics
- [ ] UpgradeOverlay - Blur + upgrade CTA

---

## Upgrade Overlay Component

For Basic plan users, locked features show:

```
┌─────────────────────────────────────────┐
│                                         │
│     [Blurred content behind]            │
│                                         │
│    ┌───────────────────────────┐        │
│    │   🔒 Upgrade to Pro       │        │
│    │                           │        │
│    │   Unlock this feature     │        │
│    │   and more with Pro!      │        │
│    │                           │        │
│    │   [Upgrade Now - $49.99]  │        │
│    └───────────────────────────┘        │
│                                         │
└─────────────────────────────────────────┘
```

---

## Implementation Priority

### Phase 1 - Core (MVP)
1. Basic POS terminal
2. Receipt generation
3. Transaction history
4. Basic customer management
5. Basic analytics (today's sales)

### Phase 2 - Enhanced
1. Full customer management
2. Payment method tracking
3. Daily/weekly reports
4. Enhanced analytics charts

### Phase 3 - Advanced
1. All report types
2. Export functionality
3. Staff performance tracking
4. Forecasting (Premium)
