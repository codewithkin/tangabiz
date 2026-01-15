import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { getUploadUrl, getDownloadUrl, deleteFile, getMaxUploadSize } from "../lib/s3";

export const uploadRoutes = new Hono();

// Validation schemas
const presignSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  folder: z.string().optional(),
});

// Get a presigned URL for uploading a file
uploadRoutes.post("/presign", requireAuth, zValidator("json", presignSchema), async (c) => {
  const { filename, contentType, folder } = c.req.valid("json");

  // Validate content type
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ];

  if (!allowedTypes.includes(contentType)) {
    return c.json(
      {
        error: "Invalid content type",
        allowedTypes,
      },
      400
    );
  }

  const { uploadUrl, fileKey, publicUrl } = await getUploadUrl(filename, contentType, {
    folder: folder || "uploads",
  });

  return c.json({
    uploadUrl,
    fileKey,
    publicUrl,
    maxSize: getMaxUploadSize(),
  });
});

// Get a presigned URL for downloading a file
uploadRoutes.get("/download", requireAuth, async (c) => {
  const fileKey = c.req.query("fileKey");

  if (!fileKey) {
    return c.json({ error: "fileKey is required" }, 400);
  }

  const downloadUrl = await getDownloadUrl(fileKey);

  return c.json({ downloadUrl });
});

// Delete a file
uploadRoutes.delete("/", requireAuth, async (c) => {
  const fileKey = c.req.query("fileKey");

  if (!fileKey) {
    return c.json({ error: "fileKey is required" }, 400);
  }

  await deleteFile(fileKey);

  return c.json({ message: "File deleted successfully" });
});
