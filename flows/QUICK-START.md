# Quick Start Guide - Tangabiz Auth Setup

## Prerequisites
- Node.js / Bun installed
- PostgreSQL database (we're using Prisma Postgres)
- Gmail account (for email testing)

---

## Installation Steps (Already Done ✅)

### 1. Install Dependencies
```bash
bun add better-auth @prisma/client nodemailer lucide-react
bun add -d @types/nodemailer
```

### 2. Create Prisma Schema
Updated `prisma/schema.prisma` with:
- User model
- Session model
- Account model
- Verification model

### 3. Create Auth Files
- `src/lib/auth.ts` - Server-side auth config
- `src/lib/auth-client.ts` - Client-side auth client
- `src/lib/email.ts` - Email sending function
- `src/lib/prisma.ts` - Prisma client singleton
- `src/app/api/auth/[...all]/route.ts` - API route handler

### 4. Create UI Pages
- `src/app/auth/page.tsx` - Magic link login
- `src/app/dashboard/page.tsx` - Dashboard
- `src/app/onboarding/page.tsx` - Role selection
- `src/app/onboarding/business/page.tsx` - Create shop
- `src/app/onboarding/join/page.tsx` - Join shop

### 5. Update Styling
- `src/app/globals.css` - Tailwind config with branding
- `src/app/layout.tsx` - Poppins font import

### 6. Create Database Tables
```bash
bun prisma generate
bun prisma db push
```

---

## Environment Setup

### Create `.env` File
```env
# Database
DATABASE_URL="your_database_url_here"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-at-least-32-characters-long"
BETTER_AUTH_URL="http://localhost:3000"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Tangabiz <noreply@tangabiz.com>"

# Client
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Generate Secret Key
```bash
openssl rand -base64 32
```
Or use online generator: https://www.better-auth.com/docs/installation

---

## Testing the Auth Flow

### 1. Start Dev Server
```bash
bun run dev
```

### 2. Visit Auth Page
```
http://localhost:3000/auth
```

### 3. Enter Your Email
- Click "Continue with Email"
- Check your inbox for magic link

### 4. Click Magic Link
- Opens magic link URL
- Redirects to `/dashboard` (existing user) or `/onboarding` (new user)

### 5. Test Onboarding
```
http://localhost:3000/onboarding
```
- Choose Business Owner or Staff Member
- Follow the respective flow

---

## File Reference

### Core Auth Files
| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | Better-auth server config with magic link plugin |
| `src/lib/auth-client.ts` | Client-side auth library for UI components |
| `src/lib/email.ts` | Nodemailer setup and email sending |
| `src/lib/prisma.ts` | Prisma client singleton |

### Page Files
| File | Purpose |
|------|---------|
| `src/app/auth/page.tsx` | Magic link email input form |
| `src/app/dashboard/page.tsx` | Protected dashboard page |
| `src/app/onboarding/page.tsx` | Role selection (Business Owner vs Staff) |
| `src/app/onboarding/business/page.tsx` | Create organization/shop form |
| `src/app/onboarding/join/page.tsx` | Join existing organization form |

### API Files
| File | Purpose |
|------|---------|
| `src/app/api/auth/[...all]/route.ts` | Catch-all route for all auth endpoints |

### Config Files
| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema definition |
| `src/app/layout.tsx` | Root layout with Poppins font |
| `src/app/globals.css` | Tailwind CSS and branding colors |
| `.env` | Environment variables (not committed to git) |

---

## Key Imports & Usage

### Sign In User
```typescript
import { authClient } from "@/lib/auth-client";

const { error } = await authClient.signIn.magicLink({
  email: "user@example.com",
  callbackURL: "/dashboard",
  newUserCallbackURL: "/onboarding",
});
```

### Get Session
```typescript
const { data: session } = await authClient.getSession();
```

### Sign Out
```typescript
await authClient.signOut();
```

### Send Magic Link Email
```typescript
import { sendMagicLinkEmail } from "@/lib/email";

await sendMagicLinkEmail({
  email: "user@example.com",
  url: "http://localhost:3000/api/auth/magic-link/verify?token=xxx",
});
```

### Database Access
```typescript
import { prisma } from "@/lib/prisma";

const user = await prisma.user.findUnique({
  where: { email: "user@example.com" },
});
```

---

## Color Reference

### Branding Colors
- **Primary Green**: `#16a34a` (rgb(22, 163, 74))
- **Secondary Yellow**: `#eab308` (rgb(234, 179, 8))

### Tailwind Classes
```css
.bg-green-600      /* Primary */
.bg-yellow-500     /* Secondary */
.text-green-600    /* Text */
.text-yellow-500   /* Text */
.border-green-200  /* Border */
.ring-green-600    /* Focus ring */
```

---

## Magic Link Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ User visits /auth                                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Enters email + clicks "Continue with Email"             │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ authClient.signIn.magicLink() called                    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Better-auth generates token (better-auth/plugins)       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ sendMagicLinkEmail() called with URL + token            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Nodemailer sends HTML email with magic link             │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ User clicks link in email                               │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ /api/auth/magic-link/verify endpoint called             │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
                ┌─────────────────┐
                │  Token Valid?   │
                └─────────────────┘
                 │              │
               Yes              No
                 │              │
       ┌─────────┴──┐  ┌────────┴──────┐
       │            │  │               │
       ▼            ▼  ▼               ▼
   New User?   Existing User?    Show Error
       │            │
       │            │
    /onboarding  /dashboard
```

---

## Debugging Tips

### Enable Database Logging
```typescript
// In src/lib/auth.ts
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  // Add this:
  databaseUrl: process.env.DATABASE_URL,
  // Or enable Prisma logging:
  // database: prismaAdapter(prismaWithLogging, ...),
});
```

### Check Magic Link Generation
```typescript
// In sendMagicLinkEmail function, log the URL
console.log("Magic link URL:", url);
```

### Test Email Directly
```bash
# Test SMTP connection
telnet smtp.gmail.com 587
```

---

## Common Issues & Solutions

### "Cannot find module '@/generated/prisma'"
```bash
# Regenerate Prisma client
bun prisma generate
```

### "SMTP connection failed"
- Verify SMTP credentials in `.env`
- Check Gmail app password (not regular password)
- Ensure 2FA is enabled on Gmail account

### "Token expired"
- Magic links expire in 5 minutes (configurable in `src/lib/auth.ts`)
- User needs to request new link

### "Database tables don't exist"
```bash
# Push schema to database
bun prisma db push

# Or create migration
bun prisma migrate dev --name init
```

---

## Next Phase: Organization Plugin

Once auth is working, integrate better-auth organization plugin:

```typescript
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
  // ... existing config
  plugins: [
    magicLink({ /* ... */ }),
    organization({
      // Options here
    }),
  ],
});
```

This will enable:
- Multi-tenant shops (organizations)
- Member roles (Admin/Manager/Staff)
- Invitations
- Role-based access control

---

You're all set! Navigate to `http://localhost:3000/auth` to test. 🚀
