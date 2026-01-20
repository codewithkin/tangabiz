# Tangabiz Native App - Migration Documentation

## Overview

Tangabiz is a **business management mobile application** built with React Native and Expo. It provides business owners with tools to manage sales, inventory, customers, and view reports - all from their mobile devices.

## Target Platform
- **Framework**: React Native with Expo (~54.0.0)
- **Routing**: expo-router (~5.0.0) - file-based routing
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand with AsyncStorage persistence
- **Icons**: @expo/vector-icons (MaterialCommunityIcons)

## Core Features

1. **Authentication** - CVT API Key-based auth with session management
2. **Onboarding** - 3-step intro carousel for first-time users
3. **Dashboard** - Business overview with stats and quick actions
4. **Point of Sale (POS)** - Create sales with cart management
5. **Products** - CRUD operations for product catalog
6. **Customers** - Customer management and database
7. **Transactions** - Sales history and filtering
8. **Reports** - Sales, inventory reports with PDF export
9. **Tatenda AI** - AI chat assistant for business insights
10. **Invoice Verification** - QR code scanning and manual ID entry
11. **Notifications** - Real-time business alerts via WebSocket
12. **Settings** - Business and user profile management
13. **Role-Based Access Control (RBAC)** - Permission-based UI

## Brand Colors

- **Primary (Green)**: `#22c55e` - Main brand color
- **Secondary (Yellow)**: `#eab308` - Accent color

## File Structure

```
app/
├── _layout.tsx           # Root layout with route protection
├── onboarding.tsx        # First-time user intro
├── sign-in.tsx           # CVT API key sign in
├── sign-up.tsx           # Redirect to CVT website
├── index.tsx             # (Redirects to tabs)
├── (tabs)/               # Bottom tab navigation
│   ├── _layout.tsx       # Tab bar configuration
│   ├── index.tsx         # Home/Dashboard
│   ├── products.tsx      # Products list
│   ├── pos.tsx           # Point of Sale
│   ├── transactions.tsx  # Sales history
│   └── more.tsx          # More menu
├── products/             # Product screens
├── customers/            # Customer screens
├── transactions/         # Transaction screens
├── reports/              # Reports screens
├── ai/                   # Tatenda AI chat
├── notifications/        # Notifications
├── settings/             # Settings screens
└── verify-invoice/       # Invoice verification
```

## Documents in This Folder

### Core Documentation (16 Files)

| # | File | Description |
|---|------|-------------|
| 01 | [01_AUTH.md](./01_AUTH.md) | Authentication system with CVT API keys |
| 02 | [02_NAVIGATION.md](./02_NAVIGATION.md) | Routing, tabs, and navigation patterns |
| 04 | [04_API_CLIENT.md](./04_API_CLIENT.md) | API utilities and endpoint reference |
| 05 | [05_DASHBOARD.md](./05_DASHBOARD.md) | Home screen stats and quick actions |
| 06 | [06_POS.md](./06_POS.md) | Point of Sale system with cart |
| 07 | [07_PRODUCTS.md](./07_PRODUCTS.md) | Product CRUD and listing |
| 08 | [08_CUSTOMERS.md](./08_CUSTOMERS.md) | Customer management |
| 09 | [09_TRANSACTIONS.md](./09_TRANSACTIONS.md) | Transaction history and filtering |
| 10 | [10_REPORTS.md](./10_REPORTS.md) | Reports dashboard and PDF export |
| 11 | [11_AI_CHAT.md](./11_AI_CHAT.md) | Tatenda AI streaming chat |
| 12 | [12_PERMISSIONS.md](./12_PERMISSIONS.md) | RBAC with 50+ permissions |
| 13 | [13_UTILITIES.md](./13_UTILITIES.md) | Haptics, toast, formatting helpers |
| 14 | [14_RESPONSIVE.md](./14_RESPONSIVE.md) | Tablet/phone responsive design |
| 15 | [15_TYPES.md](./15_TYPES.md) | TypeScript type definitions |
| 16 | [16_SETTINGS.md](./16_SETTINGS.md) | Settings and More screens |

### Advanced Documentation (3 Files)

| # | File | Description |
|---|------|-------------|
| 17 | [17_UI_DESIGN_SYSTEM.md](./17_UI_DESIGN_SYSTEM.md) | Colors, typography, components, NativeWind |
| 18 | [18_BACKEND_API_REFERENCE.md](./18_BACKEND_API_REFERENCE.md) | All API endpoints with request/response examples |
| 19 | [19_PAGE_UI_DATA_FLOW.md](./19_PAGE_UI_DATA_FLOW.md) | Page layouts, UI design, state flow, API integration |

## Quick Start Implementation Order

1. **Foundation**:
   - Set up Expo project with NativeWind
   - Create auth store ([01_AUTH.md](./01_AUTH.md))
   - Set up API client ([04_API_CLIENT.md](./04_API_CLIENT.md))
   - Add utility functions ([13_UTILITIES.md](./13_UTILITIES.md))

2. **Navigation**:
   - Set up expo-router with file-based routing ([02_NAVIGATION.md](./02_NAVIGATION.md))
   - Create tab layout with 5 tabs
   - Add route protection in root layout

3. **Core Screens**:
   - Dashboard/Home ([05_DASHBOARD.md](./05_DASHBOARD.md))
   - Products listing and CRUD ([07_PRODUCTS.md](./07_PRODUCTS.md))
   - POS system ([06_POS.md](./06_POS.md))
   - Transactions history ([09_TRANSACTIONS.md](./09_TRANSACTIONS.md))

4. **Additional Features**:
   - Customers ([08_CUSTOMERS.md](./08_CUSTOMERS.md))
   - Reports ([10_REPORTS.md](./10_REPORTS.md))
   - AI Chat ([11_AI_CHAT.md](./11_AI_CHAT.md))
   - Settings ([16_SETTINGS.md](./16_SETTINGS.md))

5. **Polish**:
   - Add RBAC permissions ([12_PERMISSIONS.md](./12_PERMISSIONS.md))
   - Implement responsive design ([14_RESPONSIVE.md](./14_RESPONSIVE.md))
   - Add proper TypeScript types ([15_TYPES.md](./15_TYPES.md))
