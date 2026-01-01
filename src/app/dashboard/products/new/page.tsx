"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload, Loader2, ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Category {
    id: string;
    name: string;
}

export default function NewProductPage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [uploading, setUploading] = React.useState(false);
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [imageUrl, setImageUrl] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [formData, setFormData] = React.useState({
        name: "",
        description: "",
        sku: "",
        barcode: "",
        price: "",
        cost: "",
        stock: "0",
        lowStockAlert: "5",
        categoryId: "",
    });

    React.useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/categories");
            if (res.ok) {
                const data = await res.json();
                setCategories(data.categories || []);
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // Get presigned URL
            const urlRes = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type,
                    folder: "products",
                }),
            });

            if (!urlRes.ok) {
                throw new Error("Failed to get upload URL");
            }

            const { uploadUrl, fileUrl } = await urlRes.json();

            // Upload to S3
            await fetch(uploadUrl, {
                method: "PUT",
                body: file,
                headers: {
                    "Content-Type": file.type,
                },
            });

            setImageUrl(fileUrl);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload image. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    image: imageUrl,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to create product");
            }

            router.push("/dashboard/products");
        } catch (error) {
            console.error("Create product error:", error);
            alert(error instanceof Error ? error.message : "Failed to create product");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/products">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Add New Product</h2>
                    <p className="text-muted-foreground">
                        Add a new item to your inventory
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Info */}
                    <Card className="border-0 shadow-lg lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Product Information</CardTitle>
                            <CardDescription>
                                Basic details about your product
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Product Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="Enter product name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Product description..."
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    rows={3}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="sku">SKU</Label>
                                    <Input
                                        id="sku"
                                        placeholder="e.g., PROD-001"
                                        value={formData.sku}
                                        onChange={(e) =>
                                            setFormData({ ...formData, sku: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="barcode">Barcode</Label>
                                    <Input
                                        id="barcode"
                                        placeholder="e.g., 123456789"
                                        value={formData.barcode}
                                        onChange={(e) =>
                                            setFormData({ ...formData, barcode: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={formData.categoryId}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, categoryId: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Image Upload */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle>Product Image</CardTitle>
                            <CardDescription>
                                Upload an image for this product
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div
                                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-green-500 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {uploading ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="h-10 w-10 text-green-600 animate-spin" />
                                        <p className="text-sm text-muted-foreground">
                                            Uploading...
                                        </p>
                                    </div>
                                ) : imageUrl ? (
                                    <div className="relative aspect-square w-full max-w-[200px] mx-auto">
                                        <Image
                                            src={imageUrl}
                                            alt="Product"
                                            fill
                                            className="object-cover rounded-lg"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                                            <ImageIcon className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <p className="text-sm font-medium">Click to upload</p>
                                        <p className="text-xs text-muted-foreground">
                                            PNG, JPG up to 5MB
                                        </p>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                            </div>
                            {imageUrl && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2 w-full"
                                    onClick={() => setImageUrl(null)}
                                >
                                    Remove image
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pricing & Stock */}
                    <Card className="border-0 shadow-lg lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Pricing & Stock</CardTitle>
                            <CardDescription>
                                Set pricing and inventory levels
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Selling Price *</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                            $
                                        </span>
                                        <Input
                                            id="price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            className="pl-7"
                                            value={formData.price}
                                            onChange={(e) =>
                                                setFormData({ ...formData, price: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cost">Cost Price</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                            $
                                        </span>
                                        <Input
                                            id="cost"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            className="pl-7"
                                            value={formData.cost}
                                            onChange={(e) =>
                                                setFormData({ ...formData, cost: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stock">Current Stock</Label>
                                    <Input
                                        id="stock"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={formData.stock}
                                        onChange={(e) =>
                                            setFormData({ ...formData, stock: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lowStockAlert">Low Stock Alert</Label>
                                    <Input
                                        id="lowStockAlert"
                                        type="number"
                                        min="0"
                                        placeholder="5"
                                        value={formData.lowStockAlert}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                lowStockAlert: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card className="border-0 shadow-lg">
                        <CardContent className="pt-6">
                            <div className="flex flex-col gap-2">
                                <Button
                                    type="submit"
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    disabled={loading || uploading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Product"
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => router.back()}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    );
}
