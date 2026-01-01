import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPresignedUploadUrl, generateS3Key, getS3Url } from "@/lib/s3";

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

        const { filename, contentType, folder } = await request.json();

        if (!filename || !contentType) {
            return NextResponse.json(
                { error: "Filename and content type are required" },
                { status: 400 }
            );
        }

        const key = generateS3Key(organizationId, folder || "uploads", filename);
        const uploadUrl = await getPresignedUploadUrl(key, contentType);
        const fileUrl = getS3Url(key);

        return NextResponse.json({
            uploadUrl,
            fileUrl,
            key,
        });
    } catch (error) {
        console.error("Upload URL error:", error);
        return NextResponse.json(
            { error: "Failed to generate upload URL" },
            { status: 500 }
        );
    }
}
