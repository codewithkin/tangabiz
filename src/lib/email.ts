import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
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
