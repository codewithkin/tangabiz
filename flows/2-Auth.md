# Tangabiz - Authentication & Authorization

## Overview

Tangabiz uses **Better-Auth** with Prisma for authentication, leveraging the **Organization Plugin** to manage shops and the **Magic Link Plugin** for passwordless authentication.

## Authentication Method

### Magic Link Only
- Users sign in via email magic link
- No password management required
- Secure and simple for SME users
- Reference: https://www.better-auth.com/docs/plugins/magic-link

## Organization Structure

Every **shop** is an **organization** in Better-Auth.

Reference: https://www.better-auth.com/docs/plugins/organization

### Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Admin** | Business owner | Full access, billing, user management |
| **Manager** | Store manager | Sales, customers, reports, staff oversight |
| **Staff** | Regular employee | POS operations, basic sales tracking |

## Authentication Flow

### Sign Up / Sign In Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     User visits /login                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Enter email → Request Magic Link                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  User clicks link in email                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Is new user?   │
                    └─────────────────┘
                     │              │
                   Yes              No
                     │              │
                     ▼              ▼
         ┌───────────────┐  ┌───────────────┐
         │  /onboarding  │  │  /dashboard   │
         └───────────────┘  └───────────────┘
```

### Callback URLs

- **Existing User**: `/dashboard`
- **New User**: `/onboarding`

## Onboarding Flow

When a new user lands on `/onboarding`, they are asked:

**"What are you here for?"**

### Option 1: Business Owner (Sign Up)
- Creates a new organization (shop)
- Becomes the **Admin** of the organization
- Redirected to subscription selection
- Starts 3-day free trial

### Option 2: Staff Member (Join)
- Enters an invite code or organization ID
- Joins an existing organization
- Role assigned by Admin (Manager or Staff)
- Redirected to dashboard

```
┌─────────────────────────────────────────────────────────────┐
│                      /onboarding                             │
│                                                              │
│   "What are you here for?"                                   │
│                                                              │
│   ┌─────────────────────┐    ┌─────────────────────┐        │
│   │   🏪 Business Owner │    │   👤 Staff Member   │        │
│   │   (Create a shop)   │    │   (Join a shop)     │        │
│   └─────────────────────┘    └─────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
              │                           │
              ▼                           ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│  Create Organization    │   │  Enter Invite Code      │
│  - Shop name            │   │  - Join organization    │
│  - Select plan          │   │  - Assigned role        │
│  - Start free trial     │   │  - Access dashboard     │
└─────────────────────────┘   └─────────────────────────┘
              │                           │
              ▼                           ▼
         /dashboard                  /dashboard
```

## Role-Based Access

### Sidebar Navigation by Role

#### Admin
- Dashboard
- Sales / POS
- Customers
- Analytics
- Reports
- Team Management
- Billing & Subscription
- Settings

#### Manager
- Dashboard
- Sales / POS
- Customers
- Analytics
- Reports
- Staff Overview
- Settings

#### Staff
- Dashboard
- Sales / POS
- Customers (view only)
- Settings (personal)

### Shared Pages with Role-Based Content

| Page | Admin View | Manager View | Staff View |
|------|------------|--------------|------------|
| Dashboard | Full metrics, revenue, team activity | Sales metrics, staff performance | Personal sales, tasks |
| Analytics | Full analytics suite | Team analytics | Basic sales stats |
| Settings | All settings + billing | Store settings | Personal settings |

## Database Schema (Prisma)

```prisma
// User model
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  sessions      Session[]
  accounts      Account[]
  members       Member[]
}

// Organization (Shop)
model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  logo        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  members     Member[]
  invitations Invitation[]
  subscription Subscription?
}

// Organization Membership
model Member {
  id             String       @id @default(cuid())
  role           Role         @default(STAFF)
  userId         String
  organizationId String
  createdAt      DateTime     @default(now())
  
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@unique([userId, organizationId])
}

enum Role {
  ADMIN
  MANAGER
  STAFF
}

// Invitation
model Invitation {
  id             String       @id @default(cuid())
  email          String
  role           Role         @default(STAFF)
  organizationId String
  expiresAt      DateTime
  createdAt      DateTime     @default(now())
  
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}
```

## Implementation Checklist

- [ ] Install better-auth and configure with Prisma
- [ ] Set up magic-link plugin
- [ ] Set up organization plugin
- [ ] Create login page with magic link form
- [ ] Create onboarding page with role selection
- [ ] Implement organization creation flow
- [ ] Implement invitation/join flow
- [ ] Create role-based sidebar component
- [ ] Implement middleware for route protection
- [ ] Create dashboard with role-based content
