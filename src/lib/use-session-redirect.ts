"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "./auth-client";

/**
 * Client-side hook to handle session-based redirection
 * Use this in client components when you need to protect a page or redirect based on auth state
 * @param requireAuth - if true, redirect to /auth if no session; if false, redirect to /dashboard if session exists
 * @returns object with { session, isLoading } for conditional rendering if needed
 */
export function useSessionRedirect(requireAuth: boolean = true) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    // Only run redirect logic after session data is loaded
    if (!isPending) {
      if (requireAuth && !session) {
        // Page requires auth but user is not authenticated
        router.push("/auth");
      } else if (!requireAuth && session) {
        // Page is for unauthenticated users but user is authenticated
        router.push("/dashboard");
      }
    }
  }, [session, isPending, requireAuth, router]);

  return {
    session,
    isLoading: isPending,
  };
}
