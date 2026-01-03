import nodemailer from "nodemailer";

// Separate transporter for marketing emails
const marketingTransporter = nodemailer.createTransport({
    host: process.env.MARKETING_SMTP_HOST,
    port: Number(process.env.MARKETING_SMTP_PORT) || 465,
    secure: true,
    auth: {
        user: process.env.MARKETING_SMTP_USER,
        pass: process.env.MARKETING_SMTP_PASS,
    },
});

interface SendMarketingEmailParams {
    to: string;
    subject: string;
    html: string;
    fromName?: string;
}

interface SendMarketingEmailResult {
    success: boolean;
    error?: string;
    messageId?: string;
}

/**
 * Send a single marketing email
 */
export async function sendMarketingEmail({
    to,
    subject,
    html,
    fromName,
}: SendMarketingEmailParams): Promise<SendMarketingEmailResult> {
    try {
        const from = fromName
            ? `${fromName} <${process.env.MARKETING_SMTP_USER}>`
            : process.env.MARKETING_SMTP_FROM || "Tangabiz <noreply@tangabiz.com>";

        const info = await marketingTransporter.sendMail({
            from,
            to,
            subject,
            html: wrapInEmailTemplate(html, subject),
        });

        return {
            success: true,
            messageId: info.messageId,
        };
    } catch (error) {
        console.error("[MARKETING-EMAIL] Failed to send:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

interface BulkSendResult {
    total: number;
    sent: number;
    failed: number;
    results: Array<{
        email: string;
        success: boolean;
        error?: string;
        messageId?: string;
    }>;
}

interface Recipient {
    email: string;
    name?: string;
}

/**
 * Send marketing emails to multiple recipients with rate limiting
 */
export async function sendBulkMarketingEmails(
    recipients: Recipient[],
    subject: string,
    html: string,
    fromName?: string,
    delayMs = 200 // Delay between emails to avoid rate limits
): Promise<BulkSendResult> {
    const results: BulkSendResult = {
        total: recipients.length,
        sent: 0,
        failed: 0,
        results: [],
    };

    for (const recipient of recipients) {
        // Personalize HTML with recipient name if available
        const personalizedHtml = personalizeHtml(html, recipient);

        const result = await sendMarketingEmail({
            to: recipient.email,
            subject: personalizeSubject(subject, recipient),
            html: personalizedHtml,
            fromName,
        });

        results.results.push({
            email: recipient.email,
            ...result,
        });

        if (result.success) {
            results.sent++;
        } else {
            results.failed++;
        }

        // Rate limiting delay
        if (delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }

    return results;
}

/**
 * Personalize HTML content with recipient data
 */
function personalizeHtml(html: string, recipient: Recipient): string {
    let personalized = html;

    // Replace common personalization tokens
    personalized = personalized.replace(/{{name}}/gi, recipient.name || "Valued Customer");
    personalized = personalized.replace(/{{email}}/gi, recipient.email);
    personalized = personalized.replace(/{{firstName}}/gi, recipient.name?.split(" ")[0] || "");

    return personalized;
}

/**
 * Personalize subject line with recipient data
 */
function personalizeSubject(subject: string, recipient: Recipient): string {
    let personalized = subject;

    personalized = personalized.replace(/{{name}}/gi, recipient.name || "Valued Customer");
    personalized = personalized.replace(/{{firstName}}/gi, recipient.name?.split(" ")[0] || "");

    return personalized;
}

/**
 * Wrap email content in a professional template
 */
function wrapInEmailTemplate(content: string, subject: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
            -webkit-font-smoothing: antialiased;
        }
        .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .email-header {
            padding: 30px;
            text-align: center;
            background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
        }
        .email-header h1 {
            margin: 0;
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
        }
        .email-content {
            padding: 30px;
        }
        .email-footer {
            padding: 20px 30px;
            background-color: #f9fafb;
            border-top: 1px solid #e5e7eb;
            text-align: center;
        }
        .email-footer p {
            margin: 0;
            color: #9ca3af;
            font-size: 12px;
        }
        .unsubscribe-link {
            color: #6b7280;
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table role="presentation" class="email-wrapper" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td class="email-header" style="padding: 30px; text-align: center; background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Tangabiz</h1>
                        </td>
                    </tr>
                    <tr>
                        <td class="email-content" style="padding: 30px;">
                            ${content}
                        </td>
                    </tr>
                    <tr>
                        <td class="email-footer" style="padding: 20px 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © ${new Date().getFullYear()} Tangabiz. All rights reserved.
                            </p>
                            <p style="margin: 10px 0 0; color: #9ca3af; font-size: 11px;">
                                You received this email because you are a customer of this business.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

/**
 * Verify the marketing email configuration
 */
export async function verifyMarketingEmailConfig(): Promise<boolean> {
    try {
        await marketingTransporter.verify();
        console.log("[MARKETING-EMAIL] SMTP configuration verified");
        return true;
    } catch (error) {
        console.error("[MARKETING-EMAIL] SMTP verification failed:", error);
        return false;
    }
}
