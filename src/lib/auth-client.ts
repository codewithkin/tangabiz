"use client";

import { createAuthClient } from "better-auth/react";
import { magicLinkClient, organizationClient } from "better-auth/client/plugins";
import { polarClient } from "@polar-sh/better-auth/client";

const getBaseURL = () => {
  const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  // Ensure URL has protocol
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
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
