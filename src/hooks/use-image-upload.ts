"use client";

import * as React from "react";
import { uploadProductImage } from "@/lib/s3Client";

interface UploadResult {
    url: string;
    key: string;
}

interface UseImageUploadReturn {
    uploadImage: (file: File, organizationId: string) => Promise<UploadResult>;
    uploading: boolean;
    progress: number;
    error: string | null;
}

export function useImageUpload(): UseImageUploadReturn {
    const [uploading, setUploading] = React.useState(false);
    const [progress, setProgress] = React.useState(0);
    const [error, setError] = React.useState<string | null>(null);

    const uploadImage = async (file: File, organizationId: string): Promise<UploadResult> => {
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

            setProgress(30);
            
            // Upload directly to S3 using new client
            console.log("[UPLOAD-HOOK] Uploading file to S3...");
            const result = await uploadProductImage(file, organizationId);
            
            console.log("[UPLOAD-HOOK] Upload completed successfully");
            setProgress(100);

            return result;
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
