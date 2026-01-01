"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";

interface Category {
    id: string;
    name: string;
}

export default function NewProductPage() {
    const router = useRouter();

    const [categories, setCategories] = React.useState<Category[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);

    // Form state
    const [name, setName] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [sku, setSku] = React.useState("");
    const [barcode, setBarcode] = React.useState("");
    const [price, setPrice] = React.useState("");
    const [cost, setCost] = React.useState("");
    const [stock, setStock] = React.useState("0");
    const [lowStockAlert, setLowStockAlert] = React.useState("5");
    const [categoryId, setCategoryId] = React.useState<string>("");
    const [imageUrl, setImageUrl] = React.useState("");

    React.useEffect(() => {
        const loadCategories = async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/categories");
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data.categories || []);
                }
            } catch (error) {
                console.error("Error loading categories:", error);
            } finally {
                setLoading(false);
            }
        };

        loadCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !price) {
            alert("Name and price are required");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description: description || null,
                    sku: sku || null,
                    barcode: barcode || null,
                    price: parseFloat(price),
                    cost: cost ? parseFloat(cost) : null,
                    stock: parseInt(stock) || 0,
                    lowStockAlert: parseInt(lowStockAlert) || 5,
                    categoryId: categoryId || null,
                    image: imageUrl || null,
                }),
            });

            if (res.ok) {
                router.push("/dashboard/inventory");
            } else {
                const error = await res.json();
                alert(error.error || "Failed to create product");
            }
        } catch (error) {
            console.error("Create error:", error);
            alert("Failed to create product");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/inventory">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold tracking-tight">New Product</h2>
                    <p className="text-muted-foreground">
                        Add a new product to your inventory
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Details */}
                    <Card className="border-0 shadow-lg lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Product Details</CardTitle>
                            <CardDescription>
                                Basic information about the product
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Product Name *</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter product name"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Product description..."
                                    rows={3}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="sku">SKU</Label>
                                    <Input
                                        id="sku"
                                        value={sku}
                                        onChange={(e) => setSku(e.target.value)}
                                        placeholder="e.g., PROD-001"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="barcode">Barcode</Label>
                                    <Input
                                        id="barcode"
                                        value={barcode}
                                        onChange={(e) => setBarcode(e.target.value)}
                                        placeholder="e.g., 1234567890123"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select value={categoryId || "none"} onValueChange={(val) => setCategoryId(val === "none" ? "" : val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Category</SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Product Image */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle>Product Image</CardTitle>
                            <CardDescription>
                                Upload a product image
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ImageUpload
                                value={imageUrl}
                                onChange={setImageUrl}
                                folder="products"
                            />
                        </CardContent>
                    </Card>

                    {/* Pricing */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle>Pricing</CardTitle>
                            <CardDescription>
                                Set product prices
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Selling Price (USD) *</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cost">Cost Price (USD)</Label>
                                <Input
                                    id="cost"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={cost}
                                    onChange={(e) => setCost(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Inventory */}
                    <Card className="border-0 shadow-lg lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Inventory</CardTitle>
                            <CardDescription>
                                Stock management settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="stock">Initial Stock</Label>
                                    <Input
                                        id="stock"
                                        type="number"
                                        min="0"
                                        value={stock}
                                        onChange={(e) => setStock(e.target.value)}
                                        placeholder="0"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lowStockAlert">Low Stock Alert</Label>
                                    <Input
                                        id="lowStockAlert"
                                        type="number"
                                        min="0"
                                        value={lowStockAlert}
                                        onChange={(e) => setLowStockAlert(e.target.value)}
                                        placeholder="5"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Alert when stock falls below this level
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 mt-6">
                    <Link href="/dashboard/inventory">
                        <Button variant="outline" type="button">
                            Cancel
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Create Product
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
