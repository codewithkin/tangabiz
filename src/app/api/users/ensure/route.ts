import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        // Verify the requester is authenticated
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { email } = await request.json();

        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ exists: true, userId: existingUser.id });
        }

        // Create a new user account
        // Since we use magic links, we don't need a password
        const newUser = await prisma.user.create({
            data: {
                id: crypto.randomUUID(),
                email,
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });

        return NextResponse.json({ exists: false, userId: newUser.id, created: true });
    } catch (error) {
        console.error("Ensure user error:", error);
        return NextResponse.json(
            { error: "Failed to ensure user exists" },
            { status: 500 }
        );
    }
}
