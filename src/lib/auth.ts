import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink, organization } from "better-auth/plugins";
import { prisma } from "./prisma";
import { sendMagicLinkEmail, sendInviteEmail } from "./email";

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
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
});

export type Session = typeof auth.$Infer.Session;
