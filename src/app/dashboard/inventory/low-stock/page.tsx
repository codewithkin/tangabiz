"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    ArrowLeft,
    Loader2,
    AlertTriangle,
    Package,
    Plus,
    Minus,
    TrendingDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface Product {
    id: string;
    name: string;
    image: string | null;
    sku: string | null;
    stock: number;
    lowStockAlert: number;
    price: number;
    category: { name: string } | null;
}

export default function LowStockPage() {
    const [products, setProducts] = React.useState<Product[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [adjustProduct, setAdjustProduct] = React.useState<Product | null>(null);
    const [adjustQuantity, setAdjustQuantity] = React.useState(0);
    const [adjustType, setAdjustType] = React.useState<"add" | "remove">("add");
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        fetchLowStockProducts();
    }, []);

    const fetchLowStockProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/products?lowStock=true");
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products || []);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    const openAdjustDialog = (product: Product) => {
        setAdjustProduct(product);
        setAdjustQuantity(0);
        setAdjustType("add");
    };

    const handleAdjustStock = async () => {
        if (!adjustProduct || adjustQuantity <= 0) return;

        const newStock =
            adjustType === "add"
                ? adjustProduct.stock + adjustQuantity
                : Math.max(0, adjustProduct.stock - adjustQuantity);

        setSaving(true);
        try {
            const res = await fetch(`/api/products/${adjustProduct.id}/stock`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stock: newStock }),
            });

            if (res.ok) {
                // Update local state
                setProducts(
                    products.map((p) =>
                        p.id === adjustProduct.id ? { ...p, stock: newStock } : p
                    ).filter((p) => p.stock <= p.lowStockAlert)
                );
                setAdjustProduct(null);
            } else {
                const error = await res.json();
                alert(error.error || "Failed to update stock");
            }
        } catch (error) {
            console.error("Stock update error:", error);
            alert("Failed to update stock");
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    const getStockBadge = (product: Product) => {
        if (product.stock === 0) {
            return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Out of Stock</Badge>;
        }
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Low Stock</Badge>;
    };

    const outOfStockCount = products.filter((p) => p.stock === 0).length;
    const lowStockCount = products.filter((p) => p.stock > 0).length;

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
                    <h2 className="text-2xl font-bold tracking-tight">Low Stock Alerts</h2>
                    <p className="text-muted-foreground">
                        Products that need to be restocked
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-0 shadow-lg border-l-4 border-l-yellow-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Low Stock Items
                        </CardTitle>
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-yellow-600">{lowStockCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Products below alert threshold
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Out of Stock
                        </CardTitle>
                        <TrendingDown className="h-5 w-5 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-600">{outOfStockCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Products with zero inventory
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Products Table */}
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle>Products Needing Restock</CardTitle>
                    <CardDescription>
                        {products.length} items need attention
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                            <Package className="h-12 w-12 mb-4 text-green-600" />
                            <p className="text-lg font-medium text-green-600">All stocked up!</p>
                            <p className="text-sm">No products are below their stock alert threshold</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Current Stock</TableHead>
                                    <TableHead className="text-right">Alert At</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {product.image ? (
                                                    <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0">
                                                        <Image
                                                            src={product.image}
                                                            alt={product.name}
                                                            width={40}
                                                            height={40}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                                        <Package className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium">{product.name}</div>
                                                    {product.sku && (
                                                        <div className="text-xs text-muted-foreground">
                                                            SKU: {product.sku}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {product.category?.name || "Uncategorized"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(product.price)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span
                                                className={
                                                    product.stock === 0
                                                        ? "text-red-600 font-bold"
                                                        : "text-yellow-600 font-bold"
                                                }
                                            >
                                                {product.stock}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {product.lowStockAlert}
                                        </TableCell>
                                        <TableCell>{getStockBadge(product)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => openAdjustDialog(product)}
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Restock
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Adjust Stock Dialog */}
            <Dialog open={!!adjustProduct} onOpenChange={() => setAdjustProduct(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adjust Stock</DialogTitle>
                        <DialogDescription>
                            Update inventory for {adjustProduct?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <span className="text-sm text-muted-foreground">Current Stock</span>
                            <span className="text-xl font-bold">{adjustProduct?.stock}</span>
                        </div>

                        <div className="space-y-2">
                            <Label>Adjustment Type</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={adjustType === "add" ? "default" : "outline"}
                                    className={adjustType === "add" ? "bg-green-600 hover:bg-green-700" : ""}
                                    onClick={() => setAdjustType("add")}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Stock
                                </Button>
                                <Button
                                    type="button"
                                    variant={adjustType === "remove" ? "default" : "outline"}
                                    className={adjustType === "remove" ? "bg-red-600 hover:bg-red-700" : ""}
                                    onClick={() => setAdjustType("remove")}
                                >
                                    <Minus className="h-4 w-4 mr-2" />
                                    Remove Stock
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input
                                id="quantity"
                                type="number"
                                min="0"
                                value={adjustQuantity}
                                onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 0)}
                            />
                        </div>

                        {adjustQuantity > 0 && adjustProduct && (
                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                                <span className="text-sm text-green-700">New Stock Level</span>
                                <span className="text-xl font-bold text-green-700">
                                    {adjustType === "add"
                                        ? adjustProduct.stock + adjustQuantity
                                        : Math.max(0, adjustProduct.stock - adjustQuantity)}
                                </span>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setAdjustProduct(null)}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAdjustStock}
                            disabled={saving || adjustQuantity <= 0}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Update Stock"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
