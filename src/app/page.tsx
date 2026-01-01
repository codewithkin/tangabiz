import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If user has a session, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  // If no session, redirect to auth
  redirect("/auth");
}
