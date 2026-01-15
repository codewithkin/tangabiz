import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// S3 Client configuration
export const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION || "us-west-2",
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || "",
  },
});

const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME || "tangabiz";
const maxUploadSize = parseInt(process.env.S3_MAX_UPLOAD_SIZE || "10485760"); // 10MB default
const presignExpires = parseInt(process.env.S3_PRESIGN_EXPIRES || "3600"); // 1 hour default

export interface UploadOptions {
  folder?: string;
  contentType?: string;
  isPublic?: boolean;
}

/**
 * Generate a presigned URL for uploading a file to S3
 */
export async function getUploadUrl(
  filename: string,
  contentType: string,
  options: UploadOptions = {}
): Promise<{ uploadUrl: string; fileKey: string; publicUrl: string }> {
  const folder = options.folder || "uploads";
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fileKey = `${folder}/${timestamp}-${sanitizedFilename}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: presignExpires,
  });

  const publicUrl = `https://${bucketName}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${fileKey}`;

  return { uploadUrl, fileKey, publicUrl };
}

/**
 * Generate a presigned URL for downloading a file from S3
 */
export async function getDownloadUrl(fileKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
  });

  return await getSignedUrl(s3Client, command, {
    expiresIn: presignExpires,
  });
}

/**
 * Delete a file from S3
 */
export async function deleteFile(fileKey: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
  });

  await s3Client.send(command);
}

/**
 * Get max upload size in bytes
 */
export function getMaxUploadSize(): number {
  return maxUploadSize;
}
