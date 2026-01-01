import { redirect } from "next/navigation";
import { auth } from "./auth";
import { headers } from "next/headers";

/**
 * Server-side function to check session and redirect based on auth state
 * Use this in server components when you need to protect a page
 * @param requireAuth - if true, redirect to /auth if no session; if false, redirect to /dashboard if session exists
 * @returns The session data if requireAuth is false, otherwise returns void
 */
export async function getSessionAndRedirect(requireAuth: boolean = true) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (requireAuth && !session) {
    // Page requires auth but user is not authenticated
    redirect("/auth");
  }

  if (!requireAuth && session) {
    // Page is for unauthenticated users but user is authenticated
    redirect("/dashboard");
  }

  return session;
}

/**
 * Server-side function to get current session (no redirect)
 * Use this when you just need to check the session without redirecting
 */
export async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}
