# Code Reference - Tangabiz Auth System

This document contains key code snippets for quick reference.

---

## Server-Side Auth (src/lib/auth.ts)

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins";
import { prisma } from "./prisma";
import { sendMagicLinkEmail } from "./email";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail({ email, url });
      },
      expiresIn: 300, // 5 minutes
      disableSignUp: false,
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
});

export type Session = typeof auth.$Infer.Session;
```

---

## Client-Side Auth (src/lib/auth-client.ts)

```typescript
"use client";

import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [magicLinkClient()],
});

export const { signIn, signOut, useSession } = authClient;
```

---

## Email Service (src/lib/email.ts)

```typescript
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendMagicLinkEmailParams {
  email: string;
  url: string;
}

export async function sendMagicLinkEmail({
  email,
  url,
}: SendMagicLinkEmailParams): Promise<void> {
  const mailOptions = {
    from: process.env.SMTP_FROM || "Tangabiz <noreply@tangabiz.com>",
    to: email,
    subject: "Sign in to Tangabiz",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sign in to Tangabiz</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <tr>
              <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #16a34a 0%, #eab308 100%);">
                <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">Tangabiz</h1>
                <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Your Business, Simplified</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">Sign in to your account</h2>
                <p style="margin: 0 0 30px; color: #6b7280; font-size: 16px; line-height: 1.6;">
                  Click the button below to securely sign in to your Tangabiz account. This link will expire in 5 minutes.
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                  <tr>
                    <td style="border-radius: 8px; background-color: #16a34a;">
                      <a href="${url}" target="_blank" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                        Sign in to Tangabiz
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin: 30px 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                  If you didn't request this email, you can safely ignore it.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                  © ${new Date().getFullYear()} Tangabiz. All rights reserved.<br>
                  Smart POS for Smart Business
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `Sign in to Tangabiz\n\nClick the link below to sign in to your account:\n${url}\n\nThis link will expire in 5 minutes.\n\nIf you didn't request this email, you can safely ignore it.`,
  };

  await transporter.sendMail(mailOptions);
}
```

---

## Prisma Client (src/lib/prisma.ts)

```typescript
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: InstanceType<typeof PrismaClient> | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({} as any);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

## Auth API Handler (src/app/api/auth/[...all]/route.ts)

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

---

## Auth Page (src/app/auth/page.tsx) - Key Component

```typescript
"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Mail, ArrowRight, CheckCircle, Loader2 } from "lucide-react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error } = await authClient.signIn.magicLink({
        email,
        callbackURL: "/dashboard",
        newUserCallbackURL: "/onboarding",
      });

      if (error) {
        setError(error.message || "Something went wrong. Please try again.");
      } else {
        setIsSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ... Rest of component with form UI and success state
}
```

---

## Database Schema (prisma/schema.prisma)

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

// ==================== BETTER-AUTH TABLES ====================

model User {
  id            String    @id
  email         String    @unique
  name          String?
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions Session[]
  accounts Account[]
}

model Session {
  id        String   @id
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                    String    @id
  userId                String
  accountId             String
  providerId            String
  accessToken           String?
  refreshToken          String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  idToken               String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

---

## Root Layout (src/app/layout.tsx)

```typescript
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Tangabiz - Smart POS for Smart Business",
  description:
    "Modern Point of Sale system for SMEs in Zimbabwe. Sales tracking, customer management, and analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

---

## Global Styles (src/app/globals.css)

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
  --primary: #16a34a;
  --primary-foreground: #ffffff;
  --secondary: #eab308;
  --secondary-foreground: #171717;
  --muted: #f4f4f5;
  --muted-foreground: #71717a;
  --border: #e4e4e7;
  --ring: #16a34a;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-ring: var(--ring);
  --font-sans: var(--font-poppins);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
    --muted: #27272a;
    --muted-foreground: #a1a1aa;
    --border: #3f3f46;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-poppins), system-ui, sans-serif;
}

/* Custom utilities */
.gradient-brand {
  background: linear-gradient(135deg, #16a34a 0%, #eab308 100%);
}
```

---

## Environment Variables (.env)

```env
# Database
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=..."

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-at-least-32-characters-long"
BETTER_AUTH_URL="http://localhost:3000"

# Email (Nodemailer SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Tangabiz <noreply@tangabiz.com>"

# Client
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Using Auth in Components

### Sign In
```typescript
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

### Use Session Hook (Client)
```typescript
"use client";
import { authClient } from "@/lib/auth-client";

export function MyComponent() {
  const { data: session } = authClient.useSession();
  
  if (!session) return <div>Not logged in</div>;
  
  return <div>Welcome {session.user.name}</div>;
}
```

---

## Useful Commands

```bash
# Start dev server
bun run dev

# Generate Prisma client
bun prisma generate

# Push schema to database
bun prisma db push

# View database
bun prisma studio

# Format code
bun run format

# Lint code
bun run lint
```

---

## Important Notes

- All passwords and tokens use Better-Auth's built-in hashing
- Magic links expire after 5 minutes (configurable)
- Sessions expire after 7 days (configurable)
- Emails are sent via SMTP (Gmail in development)
- Database is PostgreSQL via Prisma
- UI uses Tailwind CSS with custom Poppins font
- Colors: Green #16a34a + Yellow #eab308

---

**Generated**: January 1, 2026
**Project**: Tangabiz POS System
