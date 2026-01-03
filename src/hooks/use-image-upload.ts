"use client";

import * as React from "react";

interface UploadResult {
    url: string;
    key: string;
}

interface UseImageUploadReturn {
    uploadImage: (file: File, folder?: string) => Promise<UploadResult>;
    uploading: boolean;
    progress: number;
    error: string | null;
}

export function useImageUpload(): UseImageUploadReturn {
    const [uploading, setUploading] = React.useState(false);
    const [progress, setProgress] = React.useState(0);
    const [error, setError] = React.useState<string | null>(null);

    const uploadImage = async (file: File, folder = "products"): Promise<UploadResult> => {
        setUploading(true);
        setProgress(0);
        setError(null);

        try {
            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                throw new Error("File size must be less than 5MB");
            }

            // Validate file type
            const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
            if (!allowedTypes.includes(file.type)) {
                throw new Error("Only JPEG, PNG, WebP, and GIF images are allowed");
            }

            setProgress(10);
            console.log("[UPLOAD-HOOK] Starting upload for file:", file.name, file.type);

            // Get presigned URL from our API
            console.log("[UPLOAD-HOOK] Requesting presigned URL from /api/upload");
            const presignedRes = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type,
                    folder,
                }),
            });

            if (!presignedRes.ok) {
                const err = await presignedRes.json();
                console.error("[UPLOAD-HOOK] Failed to get presigned URL:", err);
                throw new Error(err.error || `Failed to get upload URL (${presignedRes.status})`);
            }

            const { uploadUrl, fileUrl, key } = await presignedRes.json();
            console.log("[UPLOAD-HOOK] Got presigned URL, uploading to S3...");
            setProgress(30);

            // Upload directly to S3
            console.log("[UPLOAD-HOOK] Uploading file to S3:", uploadUrl.substring(0, 100) + "...");
            const uploadRes = await fetch(uploadUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": file.type,
                },
                body: file,
            });

            console.log("[UPLOAD-HOOK] S3 upload response status:", uploadRes.status, uploadRes.statusText);
            if (!uploadRes.ok) {
                console.error("[UPLOAD-HOOK] S3 upload failed:", uploadRes.status, uploadRes.statusText);
                const responseText = await uploadRes.text();
                console.error("[UPLOAD-HOOK] S3 response body:", responseText);
                throw new Error(`Failed to upload image to storage (${uploadRes.status}: ${uploadRes.statusText})`);
            }

            console.log("[UPLOAD-HOOK] Upload completed successfully");
            setProgress(100);

            return { url: fileUrl, key };
        } catch (err) {
            const message = err instanceof Error ? err.message : "Upload failed";
            console.error("[UPLOAD-HOOK] Error:", message, err);
            setError(message);
            throw err;
        } finally {
            setUploading(false);
        }
    };

    return {
        uploadImage,
        uploading,
        progress,
        error,
    };
}
