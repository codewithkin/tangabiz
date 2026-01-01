import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const organizationId = session.session.activeOrganizationId;

        if (!organizationId) {
            return NextResponse.json(
                { error: "No active organization" },
                { status: 400 }
            );
        }

        // Get member info to check role
        const member = await prisma.member.findFirst({
            where: {
                userId: session.user.id,
                organizationId,
            },
        });

        if (!member) {
            return NextResponse.json(
                { error: "Not a member of this organization" },
                { status: 403 }
            );
        }

        const isStaff = member.role === "member";

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);

        const salesWhere = {
            organizationId,
            status: "completed",
            ...(isStaff ? { memberId: member.id } : {}),
        };

        // Today's stats
        const todaySales = await prisma.sale.aggregate({
            where: {
                ...salesWhere,
                createdAt: { gte: todayStart },
            },
            _count: { id: true },
            _sum: { total: true },
        });

        // This week's stats
        const weekSales = await prisma.sale.aggregate({
            where: {
                ...salesWhere,
                createdAt: { gte: weekStart },
            },
            _count: { id: true },
            _sum: { total: true },
        });

        return NextResponse.json({
            todaySales: todaySales._count.id || 0,
            todayRevenue: Number(todaySales._sum.total || 0),
            weekSales: weekSales._count.id || 0,
            weekRevenue: Number(weekSales._sum.total || 0),
        });
    } catch (error) {
        console.error("Sales stats error:", error);
        return NextResponse.json(
            { error: "Failed to fetch sales stats" },
            { status: 500 }
        );
    }
}
