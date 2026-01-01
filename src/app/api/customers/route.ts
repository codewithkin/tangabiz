import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const organizationId = session.session.activeOrganizationId;
        if (!organizationId) {
            return NextResponse.json({ error: "No active organization" }, { status: 400 });
        }

        const body = await request.json();
        const { name, email, phone, address, notes } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Customer name is required" },
                { status: 400 }
            );
        }

        const customer = await prisma.customer.create({
            data: {
                name,
                email: email || null,
                phone: phone || null,
                address: address || null,
                notes: notes || null,
                organizationId,
            },
        });

        return NextResponse.json({ customer });
    } catch (error) {
        console.error("Create customer error:", error);
        return NextResponse.json(
            { error: "Failed to create customer" },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const organizationId = session.session.activeOrganizationId;
        if (!organizationId) {
            return NextResponse.json({ error: "No active organization" }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";

        const customers = await prisma.customer.findMany({
            where: {
                organizationId,
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { email: { contains: search, mode: "insensitive" } },
                        { phone: { contains: search, mode: "insensitive" } },
                    ],
                }),
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json({ customers });
    } catch (error) {
        console.error("Get customers error:", error);
        return NextResponse.json(
            { error: "Failed to get customers" },
            { status: 500 }
        );
    }
}
