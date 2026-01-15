import nodemailer from "nodemailer";

// System email transporter (for transactional emails)
const systemTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Marketing email transporter (for email campaigns)
const marketingTransporter = nodemailer.createTransport({
  host: process.env.MARKETING_SMTP_HOST,
  port: parseInt(process.env.MARKETING_SMTP_PORT || "465"),
  secure: true,
  auth: {
    user: process.env.MARKETING_SMTP_USER,
    pass: process.env.MARKETING_SMTP_PASS,
  },
});

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send a system/transactional email
 */
export async function sendSystemEmail(options: EmailOptions): Promise<void> {
  await systemTransporter.sendMail({
    from: process.env.SMTP_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}

/**
 * Send a marketing/campaign email
 */
export async function sendMarketingEmail(options: EmailOptions): Promise<void> {
  await marketingTransporter.sendMail({
    from: process.env.MARKETING_SMTP_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}

// Email templates
export const emailTemplates = {
  /**
   * Welcome email template
   */
  welcome: (name: string, businessName: string) => ({
    subject: `Welcome to ${businessName} on Tangabiz!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #22c55e 0%, #eab308 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🌿 Tangabiz</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Welcome, ${name}!</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            You've successfully joined <strong>${businessName}</strong> on Tangabiz. 
            Start managing your business efficiently with our all-in-one platform.
          </p>
          <a href="${process.env.BETTER_AUTH_URL}" 
             style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Get Started
          </a>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Tangabiz. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  /**
   * Password reset email template
   */
  passwordReset: (name: string, resetUrl: string) => ({
    subject: "Reset your Tangabiz password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #22c55e 0%, #eab308 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🌿 Tangabiz</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Password Reset Request</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Hi ${name}, we received a request to reset your password. 
            Click the button below to create a new password.
          </p>
          <a href="${resetUrl}" 
             style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Reset Password
          </a>
          <p style="color: #9ca3af; font-size: 14px; margin-top: 20px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Tangabiz. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  /**
   * Transaction receipt email template
   */
  transactionReceipt: (
    customerName: string,
    businessName: string,
    transactionRef: string,
    total: string,
    items: Array<{ name: string; quantity: number; price: string }>
  ) => ({
    subject: `Receipt from ${businessName} - ${transactionRef}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #22c55e 0%, #eab308 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🌿 ${businessName}</h1>
          <p style="color: white; margin: 5px 0 0 0;">Powered by Tangabiz</p>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Transaction Receipt</h2>
          <p style="color: #4b5563;">Reference: <strong>${transactionRef}</strong></p>
          <p style="color: #4b5563;">Dear ${customerName},</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #e5e7eb;">
                <th style="padding: 10px; text-align: left;">Item</th>
                <th style="padding: 10px; text-align: center;">Qty</th>
                <th style="padding: 10px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px;">${item.name}</td>
                  <td style="padding: 10px; text-align: center;">${item.quantity}</td>
                  <td style="padding: 10px; text-align: right;">${item.price}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background: #22c55e; color: white;">
                <td colspan="2" style="padding: 10px; font-weight: bold;">Total</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">${total}</td>
              </tr>
            </tfoot>
          </table>
          
          <p style="color: #4b5563;">Thank you for your business!</p>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} ${businessName}. Powered by Tangabiz.</p>
        </div>
      </div>
    `,
  }),
};
