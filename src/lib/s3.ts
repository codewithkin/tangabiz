import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
    region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || "",
    },
});

const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME || "";

export async function getPresignedUploadUrl(key: string, contentType: string) {
    console.log("[S3] Getting presigned URL", { key, contentType, bucket: BUCKET_NAME });
    
    if (!BUCKET_NAME) {
        console.error("[S3] BUCKET_NAME is not set!");
        throw new Error("S3 bucket name is not configured");
    }

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    });

    try {
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        console.log("[S3] Presigned URL created successfully");
        return signedUrl;
    } catch (err) {
        console.error("[S3] Error creating presigned URL:", err);
        throw err;
    }
}

export async function deleteFromS3(key: string) {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    await s3Client.send(command);
}

export function getS3Url(key: string) {
    const region = process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1";
    const url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
    console.log("[S3] Generated S3 URL:", url);
    return url;
}

export function generateS3Key(organizationId: string, folder: string, filename: string) {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `${organizationId}/${folder}/${timestamp}-${sanitizedFilename}`;
}
