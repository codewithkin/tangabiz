"use client";

import { createAuthClient } from "better-auth/react";
import { magicLinkClient, organizationClient } from "better-auth/client/plugins";
import { polarClient } from "@polar-sh/better-auth/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [
    magicLinkClient(),
    organizationClient(),
    polarClient(),
  ],
});

export const { 
  signIn, 
  signOut, 
  useSession,
  useActiveOrganization,
  organization,
} = authClient;
