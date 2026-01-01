import { getSessionAndRedirect } from "@/lib/session";

export default async function DashboardPage() {
  // Protect this page - only authenticated users can access
  await getSessionAndRedirect(true);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to Tangabiz!</p>
        <p className="text-sm text-muted-foreground">
          This is a placeholder page. Full dashboard coming soon.
        </p>
      </div>
    </div>
  );
}
