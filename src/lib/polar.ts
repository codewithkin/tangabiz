import { Polar } from "@polar-sh/sdk";

// Create and export a singleton Polar SDK client
export const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
});

// Helper function to get active subscription for a user by email
export async function getUserSubscription(userEmail: string) {
  try {
    const result = await polarClient.subscriptions.list({
      limit: 100, // Fetch up to 100 subscriptions
    });

    // Find an active subscription for this user's email
    const activeSubscription = result.items?.find(
      (sub) =>
        (sub.status === "active" || sub.status === "trialing") &&
        sub.customer?.email === userEmail
    );

    return activeSubscription || null;
  } catch (error) {
    console.error("Error fetching subscription from Polar:", error);
    throw error;
  }
}

// Helper function to get all subscriptions for a user by email
export async function getUserSubscriptions(userEmail: string) {
  try {
    const result = await polarClient.subscriptions.list({
      limit: 100,
    });

    const subscriptions = result.items?.filter(
      (sub) => sub.customer?.email === userEmail
    ) || [];

    return subscriptions;
  } catch (error) {
    console.error("Error fetching subscriptions from Polar:", error);
    throw error;
  }
}
