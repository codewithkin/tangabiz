import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Home() {
  // Redirect based on auth state
  // No session -> /auth ; Has session -> /dashboard
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/auth");
  }
}
