import { prisma } from "@/lib/prisma";
import { sendLowStockAlert } from "@/lib/email";

interface LowStockProduct {
    name: string;
    sku: string | null;
    currentStock: number;
    alertThreshold: number;
}

interface OrganizationLowStock {
    organizationId: string;
    organizationName: string;
    ownerEmail: string;
    products: LowStockProduct[];
}

export async function checkAndSendLowStockAlerts(): Promise<{
    organizationsChecked: number;
    alertsSent: number;
    errors: string[];
}> {
    const errors: string[] = [];
    let alertsSent = 0;

    try {
        // Get all organizations with their owners
        const organizations = await prisma.organization.findMany({
            include: {
                members: {
                    where: {
                        role: "owner",
                    },
                    include: {
                        user: {
                            select: {
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        for (const org of organizations) {
            try {
                // Get low stock products for this organization
                const lowStockProducts = await prisma.product.findMany({
                    where: {
                        organizationId: org.id,
                        isActive: true,
                    },
                    select: {
                        name: true,
                        sku: true,
                        stock: true,
                        lowStockAlert: true,
                    },
                });

                // Filter products that are at or below their alert threshold
                const alertProducts = lowStockProducts.filter(
                    (p) => p.stock <= p.lowStockAlert
                );

                if (alertProducts.length === 0) {
                    continue;
                }

                // Get owner email
                const ownerMember = org.members.find((m) => m.role === "owner");
                if (!ownerMember?.user?.email) {
                    errors.push(`Organization ${org.name} has no owner email`);
                    continue;
                }

                const formattedProducts: LowStockProduct[] = alertProducts.map((p) => ({
                    name: p.name,
                    sku: p.sku,
                    currentStock: p.stock,
                    alertThreshold: p.lowStockAlert,
                }));

                // Send the alert email
                await sendLowStockAlert({
                    email: ownerMember.user.email,
                    shopName: org.name,
                    products: formattedProducts,
                    dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/inventory/low-stock`,
                });

                alertsSent++;
            } catch (orgError) {
                const message = orgError instanceof Error ? orgError.message : "Unknown error";
                errors.push(`Failed to process organization ${org.name}: ${message}`);
            }
        }

        return {
            organizationsChecked: organizations.length,
            alertsSent,
            errors,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        throw new Error(`Failed to check low stock alerts: ${message}`);
    }
}
