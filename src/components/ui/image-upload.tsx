"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useImageUpload } from "@/hooks/use-image-upload";

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    folder?: string;
    className?: string;
}

export function ImageUpload({ value, onChange, folder = "products", className }: ImageUploadProps) {
    const { uploadImage, uploading, progress, error } = useImageUpload();
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const result = await uploadImage(file, folder);
            onChange(result.url);
        } catch (err) {
            // Error is handled by the hook
            console.error("Upload error:", err);
        }

        // Reset the input
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const handleRemove = () => {
        onChange("");
    };

    return (
        <div className={className}>
            <Input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
            />

            <div className="aspect-square relative bg-muted rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/25">
                {value ? (
                    <>
                        <Image
                            src={value}
                            alt="Product image"
                            fill
                            className="object-cover"
                        />
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={handleRemove}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={uploading}
                        className="flex flex-col items-center justify-center h-full w-full hover:bg-muted-foreground/5 transition-colors"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-2" />
                                <span className="text-sm text-muted-foreground">Uploading... {progress}%</span>
                            </>
                        ) : (
                            <>
                                <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                                <span className="text-sm text-muted-foreground">Click to upload</span>
                                <span className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP, GIF (max 5MB)</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            {error && (
                <p className="text-sm text-red-500 mt-2">{error}</p>
            )}

            {value && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                >
                    <Upload className="h-4 w-4 mr-2" />
                    Replace Image
                </Button>
            )}
        </div>
    );
}
