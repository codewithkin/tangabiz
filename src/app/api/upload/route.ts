import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPresignedUploadUrl, generateS3Key, getS3Url } from "@/lib/s3";

export async function POST(request: Request) {
    try {
        console.log("[UPLOAD] Starting upload request");
        
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            console.error("[UPLOAD] No session found");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.log("[UPLOAD] Session found:", session.user?.id);

        const organizationId = session.session.activeOrganizationId;
        if (!organizationId) {
            console.error("[UPLOAD] No active organization");
            return NextResponse.json({ error: "No active organization" }, { status: 400 });
        }
        console.log("[UPLOAD] Organization ID:", organizationId);

        const body = await request.json();
        console.log("[UPLOAD] Request body:", body);
        const { filename, contentType, folder } = body;

        if (!filename || !contentType) {
            console.error("[UPLOAD] Missing filename or contentType", { filename, contentType });
            return NextResponse.json(
                { error: "Filename and content type are required" },
                { status: 400 }
            );
        }

        const key = generateS3Key(organizationId, folder || "uploads", filename);
        console.log("[UPLOAD] Generated S3 key:", key);
        
        console.log("[UPLOAD] Getting presigned URL for key:", key, "contentType:", contentType);
        const uploadUrl = await getPresignedUploadUrl(key, contentType);
        console.log("[UPLOAD] Presigned URL generated successfully");
        
        const fileUrl = getS3Url(key);
        console.log("[UPLOAD] File URL:", fileUrl);

        const response = {
            uploadUrl,
            fileUrl,
            key,
        };
        console.log("[UPLOAD] Sending response successfully");
        return NextResponse.json(response);
    } catch (error) {
        console.error("[UPLOAD] Error:", error);
        console.error("[UPLOAD] Error message:", error instanceof Error ? error.message : String(error));
        console.error("[UPLOAD] Error stack:", error instanceof Error ? error.stack : "N/A");
        return NextResponse.json(
            { error: "Failed to generate upload URL", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
