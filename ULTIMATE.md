# 🚀 Tangabiz - Ultimate Documentation

> **The All-in-One Business Management Platform**

Complete documentation for the Tangabiz monorepo, covering architecture, APIs, database schema, native app, and deployment.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Getting Started](#getting-started)
4. [Database Schema](#database-schema)
5. [Backend API Reference](#backend-api-reference)
6. [Native App (Expo)](#native-app-expo)
7. [Authentication Flow](#authentication-flow)
8. [AI Assistant (Tatenda)](#ai-assistant-tatenda)
9. [Environment Variables](#environment-variables)
10. [Deployment](#deployment)
11. [Development Workflow](#development-workflow)

---

## 🎯 Project Overview

Tangabiz is a comprehensive business management platform designed for small to medium businesses. It provides:

- **Point of Sale (POS)** - Fast, intuitive sales processing
- **Inventory Management** - Real-time stock tracking with low-stock alerts
- **Customer Management** - Customer database with purchase history
- **Transaction History** - Complete sales and refund records
- **Reports & Analytics** - Sales reports, inventory reports, PDF generation
- **AI Business Assistant** - Tatenda, an AI assistant for business insights
- **Multi-Business Support** - Manage multiple businesses with role-based access
- **Real-time Notifications** - WebSocket-powered notifications and updates

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Monorepo** | Turborepo + Bun |
| **Backend** | Hono.js + Bun runtime |
| **Database** | PostgreSQL + Prisma ORM |
| **Native App** | Expo SDK 54 + React Native 0.81.5 |
| **Navigation** | expo-router v6 (file-based) |
| **UI Library** | heroui-native |
| **State Management** | Zustand + AsyncStorage |
| **Data Fetching** | TanStack Query (React Query) |
| **AI** | Mastra AI Framework + OpenAI GPT-4o-mini |
| **Authentication** | CVT Integration (API Key based) |
| **File Storage** | AWS S3 |
| **Email** | Nodemailer |

---

## 🏗️ Architecture

```
tangabiz/
├── apps/
│   ├── server/          # Hono.js API server (Bun)
│   │   ├── prisma/      # Database schema
│   │   └── src/
│   │       ├── routes/  # API endpoints
│   │       ├── ai/      # Tatenda AI agent
│   │       ├── lib/     # Utilities (auth, db, email, s3)
│   │       └── middleware/
│   │
│   ├── native/          # Expo React Native app
│   │   ├── app/         # expo-router screens
│   │   ├── components/  # Reusable components
│   │   ├── store/       # Zustand stores
│   │   └── lib/         # API client
│   │
│   ├── web/             # Next.js web dashboard
│   └── docs/            # Documentation site
│
├── packages/
│   ├── ui/              # Shared UI components
│   ├── eslint-config/   # ESLint configurations
│   └── typescript-config/ # TypeScript configurations
│
└── native_migration/    # Migration documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Bun** >= 1.3.5
- **Node.js** >= 18
- **PostgreSQL** database
- **Expo CLI** (for native app)
- **EAS CLI** (for builds)

### Installation

```bash
# Clone and install dependencies
git clone <repo-url>
cd tangabiz
bun install

# Setup environment variables
cp apps/server/.env.example apps/server/.env
cp apps/native/.env.example apps/native/.env

# Setup database
cd apps/server
bunx prisma generate
bunx prisma db push

# Start development
bun run dev
```

### Running Individual Apps

```bash
# Backend API (runs on port 3002)
cd apps/server && bun run dev

# Native App (Expo)
cd apps/native && bun run dev

# Web Dashboard
cd apps/web && bun run dev
```

---

## 🗃️ Database Schema

### Core Models

#### User & Authentication

```prisma
model User {
  id                  String    @id @default(cuid())
  email               String    @unique
  emailVerified       Boolean   @default(false)
  name                String
  image               String?
  sessions            Session[]
  accounts            Account[]
  businessMembers     BusinessMember[]
  notifications       Notification[]
  aiConversations     AiConversation[]
}

model Session {
  id           String   @id @default(cuid())
  expiresAt    DateTime
  token        String   @unique
  userId       String
  ipAddress    String?
  userAgent    String?
}
```

#### Business & Roles

```prisma
enum Role {
  ADMIN     // Full access to all features
  MANAGER   // Can view reports and analytics
  STAFF     // Basic POS and inventory access
}

model Business {
  id            String   @id @default(cuid())
  name          String
  slug          String   @unique
  logo          String?
  currency      String   @default("USD")
  timezone      String   @default("UTC")
  invoiceFooter String?
  members       BusinessMember[]
  products      Product[]
  categories    Category[]
  customers     Customer[]
  transactions  Transaction[]
}

model BusinessMember {
  id         String   @id @default(cuid())
  role       Role     @default(STAFF)
  userId     String
  businessId String
  @@unique([userId, businessId])
}
```

#### Products & Inventory

```prisma
model Category {
  id          String    @id @default(cuid())
  name        String
  slug        String
  businessId  String
  products    Product[]
  @@unique([businessId, slug])
}

model Product {
  id          String   @id @default(cuid())
  name        String
  slug        String
  sku         String?
  barcode     String?
  image       String?
  images      String[]           // Multiple images
  price       Decimal  @db.Decimal(10, 2)
  costPrice   Decimal? @db.Decimal(10, 2)
  quantity    Int      @default(0)
  minQuantity Int      @default(0)  // Low stock threshold
  unit        String   @default("piece")
  businessId  String
  categoryId  String?
  @@unique([businessId, slug])
  @@unique([businessId, sku])
}
```

#### Transactions

```prisma
enum TransactionType {
  SALE
  REFUND
  EXPENSE
  INCOME
}

enum TransactionStatus {
  PENDING
  COMPLETED
  CANCELLED
  REFUNDED
}

enum PaymentMethod {
  CASH
  CARD
  BANK_TRANSFER
  MOBILE_MONEY
  OTHER
}

model Transaction {
  id            String            @id @default(cuid())
  invoiceId     String            @unique  // 8-char verification code
  reference     String            @unique
  type          TransactionType   @default(SALE)
  status        TransactionStatus @default(COMPLETED)
  paymentMethod PaymentMethod     @default(CASH)
  subtotal      Decimal           @db.Decimal(12, 2)
  discount      Decimal           @default(0)
  total         Decimal           @db.Decimal(12, 2)
  amountPaid    Decimal           @db.Decimal(12, 2)
  change        Decimal           @default(0)
  items         TransactionItem[]
  customerId    String?
  businessId    String
}

model TransactionItem {
  id            String   @id @default(cuid())
  quantity      Int
  unitPrice     Decimal  @db.Decimal(10, 2)
  discount      Decimal  @default(0)
  total         Decimal  @db.Decimal(12, 2)
  productName   String   // Snapshot at time of sale
  productSku    String?
  transactionId String
  productId     String?
}
```

#### Customers

```prisma
model Customer {
  id          String   @id @default(cuid())
  name        String
  email       String?
  phone       String?
  address     String?
  city        String?
  country     String?
  notes       String?
  businessId  String
  transactions Transaction[]
}
```

#### Notifications

```prisma
enum NotificationType {
  LOW_STOCK
  NEW_SALE
  LARGE_SALE
  NEW_CUSTOMER
  DAILY_SUMMARY
  WEEKLY_REPORT
  GOAL_ACHIEVED
  SYSTEM
}

model Notification {
  id          String             @id @default(cuid())
  type        NotificationType
  title       String
  message     String
  data        Json?
  isRead      Boolean            @default(false)
  channels    NotificationChannel[]
  userId      String
  businessId  String
}

model NotificationPreference {
  lowStockEmail       Boolean  @default(true)
  lowStockPush        Boolean  @default(true)
  newSalePush         Boolean  @default(true)
  largeSaleEmail      Boolean  @default(true)
  largeSaleThreshold  Decimal  @default(10000)
  dailySummaryEmail   Boolean  @default(true)
  weeklyReportEmail   Boolean  @default(true)
}
```

#### AI Conversations

```prisma
model AiConversation {
  id         String   @id @default(cuid())
  threadId   String
  userId     String
  businessId String
  role       String   // "user" | "assistant"
  content    String   @db.Text
}
```

---

## 🔌 Backend API Reference

Base URL: `http://localhost:3002`

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/sign-in` | POST | Sign in with CVT API key |
| `/api/auth/verify` | POST | Verify session token |
| `/api/auth/sign-out` | POST | Sign out and invalidate session |

**Sign In Request:**
```json
POST /api/auth/sign-in
{
  "apiKey": "cvt_api_key_here"
}
```

**Response:**
```json
{
  "success": true,
  "user": { "id": "...", "email": "...", "name": "..." },
  "session": { "token": "jwt_token", "expiresAt": "..." },
  "businesses": [{ "id": "...", "name": "...", "role": "ADMIN" }],
  "service": { "id": "...", "status": "active", "paid": true }
}
```

### Businesses

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/businesses` | GET | List user's businesses |
| `/api/businesses` | POST | Create new business |
| `/api/businesses/:id` | GET | Get business details |
| `/api/businesses/:id` | PUT | Update business |
| `/api/businesses/:id/stats` | GET | Get business statistics |
| `/api/businesses/:id/members` | GET | List team members |
| `/api/businesses/:id/members` | POST | Add team member |

### Products

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/products` | GET | List products (with pagination/search) |
| `/api/products` | POST | Create product |
| `/api/products/:id` | GET | Get product details |
| `/api/products/:id` | PUT | Update product |
| `/api/products/:id` | DELETE | Delete product |
| `/api/products/low-stock` | GET | Get low stock products |
| `/api/products/categories` | GET | List categories |

**Query Parameters:**
- `businessId` - Required
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `search` - Search term
- `categoryId` - Filter by category
- `lowStock` - Only low stock items (boolean)

### Customers

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/customers` | GET | List customers |
| `/api/customers` | POST | Create customer |
| `/api/customers/:id` | GET | Get customer details |
| `/api/customers/:id` | PUT | Update customer |
| `/api/customers/:id` | DELETE | Delete customer |
| `/api/customers/:id/transactions` | GET | Customer's transactions |

### Transactions

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/transactions` | GET | List transactions |
| `/api/transactions` | POST | Create transaction (sale) |
| `/api/transactions/:id` | GET | Get transaction details |
| `/api/transactions/:id/refund` | POST | Process refund |
| `/api/transactions/:id/receipt` | GET | Generate receipt PDF |

**Create Transaction:**
```json
POST /api/transactions
{
  "businessId": "...",
  "customerId": "...",  // optional
  "paymentMethod": "CASH",
  "items": [
    { "productId": "...", "quantity": 2 }
  ],
  "discount": 0,
  "amountPaid": 100.00,
  "notes": "..."
}
```

### Reports

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reports/sales` | GET | Sales report |
| `/api/reports/inventory` | GET | Inventory report |
| `/api/reports/customers` | GET | Customer report |
| `/api/reports/:id/pdf` | GET | Generate report PDF |

### Notifications

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notifications` | GET | List notifications |
| `/api/notifications/:id/read` | POST | Mark as read |
| `/api/notifications/read-all` | POST | Mark all as read |
| `/api/notifications/preferences` | GET | Get preferences |
| `/api/notifications/preferences` | PUT | Update preferences |

### AI (Tatenda)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/chat` | POST | Send message to Tatenda |
| `/api/ai/conversations` | GET | List conversations |
| `/api/ai/conversations/:threadId` | GET | Get conversation history |

**Chat Request:**
```json
POST /api/ai/chat
{
  "businessId": "...",
  "message": "What were my sales today?",
  "threadId": "..."  // optional, for continuing conversation
}
```

### File Upload

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload/presigned-url` | POST | Get S3 presigned URL |
| `/api/upload/confirm` | POST | Confirm upload complete |

---

## 📱 Native App (Expo)

### Project Structure

```
apps/native/
├── app/                    # expo-router screens
│   ├── _layout.tsx         # Root layout with providers
│   ├── sign-in.tsx         # Login screen
│   ├── onboarding.tsx      # First-time user flow
│   ├── (tabs)/             # Main tab navigation
│   │   ├── _layout.tsx     # Tab bar configuration
│   │   ├── index.tsx       # Dashboard
│   │   ├── products.tsx    # Products list
│   │   ├── pos.tsx         # Point of Sale
│   │   ├── transactions.tsx # Transaction history
│   │   └── more.tsx        # Settings/More menu
│   ├── ai/                 # AI Chat screen
│   │   └── index.tsx
│   ├── customers/          # Customer management
│   │   ├── index.tsx
│   │   └── create.tsx
│   └── products/           # Product management
│       └── create.tsx
├── components/             # Reusable components
├── store/                  # Zustand stores
│   └── auth.ts             # Authentication state
├── lib/                    # Utilities
│   └── api.ts              # API client
└── contexts/               # React contexts
```

### Key Features

#### Authentication Store (`store/auth.ts`)

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  businesses: Business[];
  currentBusiness: Business | null;
  isLoading: boolean;
  isHydrated: boolean;

  signIn: (apiKey: string) => Promise<Result>;
  signOut: () => Promise<void>;
  verifySession: () => Promise<boolean>;
  setCurrentBusiness: (business: Business) => void;
}

// Usage
const { user, signIn, signOut } = useAuthStore();
```

#### API Client (`lib/api.ts`)

```typescript
import { apiRequest, productApi, customerApi, transactionApi } from './api';

// Generic request
const response = await apiRequest<Product[]>('/api/products', {
  method: 'GET',
  params: { businessId: 'xxx', page: 1 }
});

// Typed helpers
const products = await productApi.list(businessId, { page: 1, limit: 20 });
const product = await productApi.create(businessId, data);
const customers = await customerApi.list(businessId);
const sale = await transactionApi.create(businessId, saleData);
```

#### Navigation Routes

| Route | Screen | Description |
|-------|--------|-------------|
| `/sign-in` | Login | CVT API key authentication |
| `/onboarding` | Onboarding | First-time user setup |
| `/(tabs)` | Dashboard | Main dashboard |
| `/(tabs)/products` | Products | Product listing |
| `/(tabs)/pos` | POS | Point of Sale |
| `/(tabs)/transactions` | Transactions | Transaction history |
| `/(tabs)/more` | More | Settings and menu |
| `/ai` | AI Chat | Chat with Tatenda |
| `/customers` | Customers | Customer list |
| `/customers/create` | Add Customer | Create customer |
| `/products/create` | Add Product | Create product |

### UI Components (heroui-native)

```tsx
import { Button, Card, Chip, Text, Badge } from 'heroui-native';
import { TextInput } from 'react-native';

// Button variants: primary, secondary, tertiary, ghost, danger
<Button variant="primary" isDisabled={loading}>
  <Text>Save</Text>
</Button>

// Chip colors: success, warning, danger, default
<Chip color="success">Active</Chip>

// TextInput styling
<TextInput
  className="bg-gray-100 rounded-lg px-4 py-3"
  style={{ color: foregroundColor }}
  placeholder="Search..."
  placeholderTextColor="#999"
/>
```

### Theme Colors

```typescript
import { useThemeColor } from '@/components/Themed';

// Valid theme color keys:
const color = useThemeColor('link');      // Primary actions
const success = useThemeColor('success'); // Success states
const danger = useThemeColor('danger');   // Error/delete
const warning = useThemeColor('warning'); // Warnings
const muted = useThemeColor('muted');     // Secondary text
const foreground = useThemeColor('foreground'); // Main text
const background = useThemeColor('background'); // Background
```

---

## 🔐 Authentication Flow

Tangabiz uses CVT (CodeVault Technologies) for authentication:

```
┌─────────────────────────────────────────────────────────────┐
│                     Authentication Flow                      │
└─────────────────────────────────────────────────────────────┘

1. User enters CVT API Key
        │
        ▼
2. POST /api/auth/sign-in { apiKey }
        │
        ▼
3. Server verifies with CVT Backend
   ├── Invalid → Return error
   ├── Unpaid → Return needsPayment: true
   └── Valid → Continue
        │
        ▼
4. Get user profile from CVT
        │
        ▼
5. Find/Create user in Tangabiz DB
        │
        ▼
6. Generate JWT session token
        │
        ▼
7. Create session in database
        │
        ▼
8. Return user, session, businesses
        │
        ▼
9. Store in Zustand (persisted to AsyncStorage)
        │
        ▼
10. Navigate to /(tabs) dashboard
```

### Session Management

- Sessions expire in **7 days**
- Token is stored in Zustand, persisted to AsyncStorage
- All API requests include `Authorization: Bearer <token>`
- Session verification happens on app launch

---

## 🤖 AI Assistant (Tatenda)

Tatenda is a business AI assistant built with Mastra AI Framework.

### Capabilities

| Tool | Description | Access Level |
|------|-------------|--------------|
| `getBusinessInfo` | Business details | All roles |
| `getInventoryStatus` | Stock levels | All roles |
| `searchProducts` | Find products | All roles |
| `getRecentTransactions` | Transaction history | All roles |
| `getSalesSummary` | Sales analytics | Manager, Admin |
| `getCustomerInsights` | Customer analytics | Manager, Admin |

### Role-Based Access

```typescript
// STAFF - Basic access
"You can view products, inventory, and recent transactions."

// MANAGER - Extended access
"You can also view sales summaries and customer insights."

// ADMIN - Full access
"You have full access to all business data and settings."
```

### Example Interactions

```
User: "What were my sales today?"
Tatenda: "Great question! Let me check your sales for today... 
         📊 Today's Sales Summary:
         • Total Sales: $1,234.56
         • Transactions: 23
         • Top Product: iPhone Cases (12 sold)
         That's 15% higher than yesterday! 🎉"

User: "Which products are running low?"
Tatenda: "I'll check your inventory... ⚠️ Low Stock Alert:
         • USB Cables: 5 remaining (min: 10)
         • Phone Chargers: 3 remaining (min: 15)
         Would you like me to help create a restock list?"
```

---

## ⚙️ Environment Variables

### Server (`apps/server/.env`)

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/tangabiz"

# Server
PORT=3002
NODE_ENV=development

# CVT Integration
CVT_BACKEND_API_URL="https://api.cvt.co.zw"
CVT_FRONTEND_URL="https://cvt.co.zw"

# JWT
JWT_SECRET="your-secret-key"

# AWS S3
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
AWS_S3_BUCKET="tangabiz-uploads"

# Email (SMTP)
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="..."
SMTP_PASS="..."
SMTP_FROM="noreply@tangabiz.com"

# OpenAI (for Tatenda)
OPENAI_API_KEY="sk-..."
```

### Native App (`apps/native/.env`)

```env
EXPO_PUBLIC_API_URL="http://localhost:3002"
EXPO_PUBLIC_CVT_FRONTEND="https://cvt.co.zw"
```

---

## 🚀 Deployment

### Backend (Bun)

```bash
# Build
cd apps/server
bun run build

# Start production
bun run start
```

**Docker:**
```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bunx prisma generate
RUN bun run build
EXPOSE 3002
CMD ["bun", "run", "start"]
```

### Native App (EAS Build)

```bash
cd apps/native

# Development build
eas build --profile development --platform android

# Preview build
eas build --profile preview --platform all

# Production build
eas build --profile production --platform all

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

**EAS Configuration (`eas.json`):**
```json
{
  "cli": { "version": ">= 15.0.14" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {}
  }
}
```

---

## 💻 Development Workflow

### Commands

```bash
# Root level (Turborepo)
bun install          # Install all dependencies
bun run dev          # Start all apps in dev mode
bun run build        # Build all apps
bun run lint         # Lint all apps
bun run typecheck    # Type check all apps

# Server
cd apps/server
bun run dev          # Hot reload server
bun run db:studio    # Open Prisma Studio
bun run db:migrate   # Run migrations

# Native
cd apps/native
bun run dev          # Start Expo dev server
bun run android      # Run on Android
bun run ios          # Run on iOS
```

### Adding a New Screen

1. Create file in `apps/native/app/` directory
2. Export default React component
3. expo-router automatically creates route

```tsx
// apps/native/app/settings/profile.tsx
export default function ProfileScreen() {
  return <View>...</View>;
}
// Access at /settings/profile
```

### Adding a New API Route

```typescript
// apps/server/src/routes/my-feature.ts
import { Hono } from "hono";
export const myFeatureRoutes = new Hono();

myFeatureRoutes.get("/", async (c) => {
  return c.json({ data: "..." });
});

// Mount in apps/server/src/index.ts
app.route("/api/my-feature", myFeatureRoutes);
```

### Database Changes

```bash
# Edit schema.prisma, then:
cd apps/server
bunx prisma migrate dev --name description_of_change
bunx prisma generate
```

---

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev)
- [expo-router Docs](https://docs.expo.dev/router/introduction/)
- [Hono.js Docs](https://hono.dev)
- [Prisma Docs](https://www.prisma.io/docs)
- [heroui-native](https://github.com/heroui/heroui-native)
- [Mastra AI](https://mastra.ai)
- [TanStack Query](https://tanstack.com/query)
- [Zustand](https://zustand-demo.pmnd.rs)

---

## 🎉 Quick Reference Card

| Task | Command/Location |
|------|-----------------|
| Start dev | `bun run dev` (root) |
| Database UI | `bunx prisma studio` |
| Build Android | `eas build -p android` |
| Add screen | Create file in `app/` |
| Add API route | Create in `src/routes/` |
| Auth state | `useAuthStore()` |
| API calls | `apiRequest()` or typed helpers |
| Theme color | `useThemeColor('link')` |

---

**Built with ❤️ by the Tangabiz Team**

*Last updated: $(date)*
