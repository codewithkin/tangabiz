import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendMagicLinkEmailParams {
  email: string;
  url: string;
}

export async function sendMagicLinkEmail({
  email,
  url,
}: SendMagicLinkEmailParams): Promise<void> {
  const mailOptions = {
    from: process.env.SMTP_FROM || "Tangabiz <noreply@tangabiz.com>",
    to: email,
    subject: "Sign in to Tangabiz",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sign in to Tangabiz</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <tr>
              <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #16a34a 0%, #eab308 100%);">
                <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">Tangabiz</h1>
                <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Your Business, Simplified</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">Sign in to your account</h2>
                <p style="margin: 0 0 30px; color: #6b7280; font-size: 16px; line-height: 1.6;">
                  Click the button below to securely sign in to your Tangabiz account. This link will expire in 5 minutes.
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                  <tr>
                    <td style="border-radius: 8px; background-color: #16a34a;">
                      <a href="${url}" target="_blank" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                        Sign in to Tangabiz
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin: 30px 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                  If you didn't request this email, you can safely ignore it.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                  © ${new Date().getFullYear()} Tangabiz. All rights reserved.<br>
                  Smart POS for Smart Business
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `Sign in to Tangabiz\n\nClick the link below to sign in to your account:\n${url}\n\nThis link will expire in 5 minutes.\n\nIf you didn't request this email, you can safely ignore it.`,
  };

  await transporter.sendMail(mailOptions);
}

interface SendInviteEmailParams {
  email: string;
  inviteLink: string;
  inviterName: string;
  inviterEmail: string;
  shopName: string;
  role: string;
}

export async function sendInviteEmail({
  email,
  inviteLink,
  inviterName,
  inviterEmail,
  shopName,
  role,
}: SendInviteEmailParams): Promise<void> {
  const mailOptions = {
    from: process.env.SMTP_FROM || "Tangabiz <noreply@tangabiz.com>",
    to: email,
    subject: `You've been invited to join ${shopName} on Tangabiz`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Join ${shopName} on Tangabiz</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <tr>
              <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #16a34a 0%, #eab308 100%);">
                <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">Tangabiz</h1>
                <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Your Business, Simplified</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">You're invited to join ${shopName}!</h2>
                <p style="margin: 0 0 20px; color: #6b7280; font-size: 16px; line-height: 1.6;">
                  <strong>${inviterName || inviterEmail}</strong> has invited you to join <strong>${shopName}</strong> as a <strong>${role}</strong>.
                </p>
                <p style="margin: 0 0 30px; color: #6b7280; font-size: 16px; line-height: 1.6;">
                  Click the button below to accept this invitation and start using Tangabiz POS.
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                  <tr>
                    <td style="border-radius: 8px; background-color: #16a34a;">
                      <a href="${inviteLink}" target="_blank" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                        Accept Invitation
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin: 30px 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                  If you didn't expect this invitation, you can safely ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                  © ${new Date().getFullYear()} Tangabiz. All rights reserved.<br>
                  Smart POS for Smart Business
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `You're invited to join ${shopName}!\n\n${inviterName || inviterEmail} has invited you to join ${shopName} as a ${role}.\n\nClick the link below to accept this invitation:\n${inviteLink}\n\nIf you didn't expect this invitation, you can safely ignore this email.`,
  };

  await transporter.sendMail(mailOptions);
}

interface LowStockProduct {
  name: string;
  sku: string | null;
  currentStock: number;
  alertThreshold: number;
}

interface SendLowStockAlertParams {
  email: string;
  shopName: string;
  products: LowStockProduct[];
  dashboardUrl: string;
}

export async function sendLowStockAlert({
  email,
  shopName,
  products,
  dashboardUrl,
}: SendLowStockAlertParams): Promise<void> {
  const productRows = products
    .map(
      (p) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>${p.name}</strong>
          ${p.sku ? `<br><span style="color: #9ca3af; font-size: 12px;">SKU: ${p.sku}</span>` : ""}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: ${p.currentStock === 0 ? "#dc2626" : "#ca8a04"}; font-weight: 600;">
          ${p.currentStock}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280;">
          ${p.alertThreshold}
        </td>
      </tr>
    `
    )
    .join("");

  const outOfStockCount = products.filter((p) => p.currentStock === 0).length;
  const lowStockCount = products.length - outOfStockCount;

  const mailOptions = {
    from: process.env.SMTP_FROM || "Tangabiz <noreply@tangabiz.com>",
    to: email,
    subject: `⚠️ Low Stock Alert - ${products.length} products need attention at ${shopName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Low Stock Alert - ${shopName}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <tr>
              <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #ca8a04 0%, #dc2626 100%);">
                <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">⚠️ Low Stock Alert</h1>
                <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${shopName}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px;">
                <div style="display: flex; gap: 20px; margin-bottom: 30px;">
                  <div style="flex: 1; padding: 20px; background-color: #fef3c7; border-radius: 8px; text-align: center;">
                    <p style="margin: 0; font-size: 28px; font-weight: 700; color: #ca8a04;">${lowStockCount}</p>
                    <p style="margin: 5px 0 0; font-size: 14px; color: #92400e;">Low Stock</p>
                  </div>
                  <div style="flex: 1; padding: 20px; background-color: #fee2e2; border-radius: 8px; text-align: center;">
                    <p style="margin: 0; font-size: 28px; font-weight: 700; color: #dc2626;">${outOfStockCount}</p>
                    <p style="margin: 5px 0 0; font-size: 14px; color: #991b1b;">Out of Stock</p>
                  </div>
                </div>
                
                <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 20px; font-weight: 600;">Products Needing Restock</h2>
                
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                  <thead>
                    <tr style="background-color: #f9fafb;">
                      <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Product</th>
                      <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Current</th>
                      <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Alert At</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${productRows}
                  </tbody>
                </table>

                <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 30px auto 0;">
                  <tr>
                    <td style="border-radius: 8px; background-color: #16a34a;">
                      <a href="${dashboardUrl}" target="_blank" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                        Manage Inventory
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                  © ${new Date().getFullYear()} Tangabiz. All rights reserved.<br>
                  You're receiving this because you have low stock alerts enabled.
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `Low Stock Alert for ${shopName}\n\n${products.length} products need attention:\n\n${products.map((p) => `- ${p.name} (${p.sku || "No SKU"}): ${p.currentStock} units (Alert at ${p.alertThreshold})`).join("\n")}\n\nManage your inventory at: ${dashboardUrl}`,
  };

  await transporter.sendMail(mailOptions);
}
