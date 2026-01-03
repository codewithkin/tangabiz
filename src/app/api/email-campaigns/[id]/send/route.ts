import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { sendBulkMarketingEmails } from "@/lib/marketing-email";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/email-campaigns/[id]/send - Send a campaign to all customers
export async function POST(_request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const session = await getSession();

        if (!session?.session?.activeOrganizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const organizationId = session.session.activeOrganizationId;

        // Get the campaign
        const campaign = await prisma.emailCampaign.findFirst({
            where: { id, organizationId },
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        // Can only send draft campaigns
        if (campaign.status !== "draft") {
            return NextResponse.json(
                { error: `Campaign is already ${campaign.status}` },
                { status: 400 }
            );
        }

        // Get organization details for from name
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { name: true, plan: true },
        });

        if (!organization?.plan || organization.plan === "starter") {
            return NextResponse.json(
                { error: "Email marketing requires Growth or Business plan" },
                { status: 403 }
            );
        }

        // Get all customers with email
        const customers = await prisma.customer.findMany({
            where: {
                organizationId,
                email: { not: null },
            },
            select: {
                email: true,
                name: true,
            },
        });

        if (customers.length === 0) {
            return NextResponse.json(
                { error: "No customers with email addresses found" },
                { status: 400 }
            );
        }

        // Update campaign status to sending
        await prisma.emailCampaign.update({
            where: { id },
            data: {
                status: "sending",
                recipientCount: customers.length,
            },
        });

        // Create recipient records
        type CustomerWithEmail = { email: string; name: string };
        const recipients: CustomerWithEmail[] = customers
            .filter((c): c is CustomerWithEmail => c.email !== null)
            .map((c) => ({
                email: c.email,
                name: c.name,
            }));

        await prisma.emailRecipient.createMany({
            data: recipients.map((r: CustomerWithEmail) => ({
                campaignId: id,
                email: r.email,
                name: r.name,
                status: "pending",
            })),
        });

        // Send emails in background (fire and forget for now)
        // In production, you'd want to use a job queue
        sendBulkMarketingEmails(
            recipients,
            campaign.subject,
            campaign.content,
            organization.name
        )
            .then(async (results) => {
                // Update campaign with results
                await prisma.emailCampaign.update({
                    where: { id },
                    data: {
                        status: results.failed === results.total ? "failed" : "sent",
                        sentCount: results.sent,
                        failedCount: results.failed,
                        sentAt: new Date(),
                    },
                });

                // Update individual recipient statuses
                for (const result of results.results) {
                    await prisma.emailRecipient.updateMany({
                        where: {
                            campaignId: id,
                            email: result.email,
                        },
                        data: {
                            status: result.success ? "sent" : "failed",
                            sentAt: result.success ? new Date() : null,
                            error: result.error || null,
                        },
                    });
                }

                console.log(`[EMAIL-CAMPAIGNS] Campaign ${id} completed:`, results);
            })
            .catch(async (error) => {
                console.error(`[EMAIL-CAMPAIGNS] Campaign ${id} failed:`, error);
                await prisma.emailCampaign.update({
                    where: { id },
                    data: { status: "failed" },
                });
            });

        return NextResponse.json({
            message: "Campaign is being sent",
            recipientCount: customers.length,
        });
    } catch (error) {
        console.error("[EMAIL-CAMPAIGNS] SEND error:", error);
        return NextResponse.json(
            { error: "Failed to send campaign" },
            { status: 500 }
        );
    }
}
