import { getSessionAndRedirect } from "@/lib/session";

export default async function Home() {
  // Redirect based on auth state
  // No session: redirect to /auth
  // Has session: redirect to /dashboard
  await getSessionAndRedirect(true);
}
