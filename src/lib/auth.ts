import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink, organization } from "better-auth/plugins";
import { polar, checkout, portal, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { prisma } from "./prisma";
import { sendMagicLinkEmail, sendInviteEmail } from "./email";

// Create Polar SDK client
const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  // Use 'sandbox' for development, 'production' for live
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
});

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
    organization({
      async sendInvitationEmail(data) {
        const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
        const inviteLink = `${baseUrl}/accept-invitation/${data.id}`;
        await sendInviteEmail({
          email: data.email,
          inviteLink,
          inviterName: data.inviter.user.name || "",
          inviterEmail: data.inviter.user.email,
          shopName: data.organization.name,
          role: data.role,
        });
      },
    }),
    polar({
      client: polarClient,
      createCustomerOnSignUp: false, // Customers created during checkout
      use: [
        checkout({
          products: [
            { productId: process.env.POLAR_STARTER_PRODUCT_ID!, slug: "starter" },
            { productId: process.env.POLAR_GROWTH_PRODUCT_ID!, slug: "growth" },
            { productId: process.env.POLAR_ENTERPRISE_PRODUCT_ID!, slug: "enterprise" },
          ],
          successUrl: "/payments?status=success",
          authenticatedUsersOnly: true,
        }),
        portal({
          returnUrl: process.env.BETTER_AUTH_URL || "http://localhost:3000",
        }),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET!,
          onOrderPaid: async (payload) => {
            // Update organization plan when order is paid
            const { customer, product } = payload.data;
            if (customer?.externalId && product?.name) {
              const planName = product.name.toLowerCase();
              // Extract plan type from product name
              let plan: string | null = null;
              if (planName.includes("starter")) plan = "starter";
              else if (planName.includes("growth")) plan = "growth";
              else if (planName.includes("enterprise")) plan = "enterprise";

              if (plan) {
                // Find org by user ID (externalId is user ID)
                const member = await prisma.member.findFirst({
                  where: { userId: customer.externalId, role: "owner" },
                });
                if (member) {
                  await prisma.organization.update({
                    where: { id: member.organizationId },
                    data: { plan, planStartedAt: new Date() },
                  });
                }
              }
            }
          },
          onSubscriptionCanceled: async (payload) => {
            // Handle subscription cancellation - could set plan to null or keep active until end of period
            console.log("Subscription canceled:", payload.data.id);
          },
        }),
      ],
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
});

export type Session = typeof auth.$Infer.Session;
