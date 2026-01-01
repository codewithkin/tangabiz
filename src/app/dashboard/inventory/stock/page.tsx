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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Search,
    Package,
    Loader2,
    AlertTriangle,
    TrendingDown,
    PackageCheck,
    Plus,
    Minus,
    ArrowUpDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface Category {
    id: string;
    name: string;
}

interface Product {
    id: string;
    name: string;
    image: string | null;
    sku: string | null;
    stock: number;
    lowStockAlert: number;
    price: number;
    category: Category | null;
}

export default function StockPage() {
    const [products, setProducts] = React.useState<Product[]>([]);
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [categoryFilter, setCategoryFilter] = React.useState("all");
    const [stockFilter, setStockFilter] = React.useState("all");

    // Adjust stock dialog
    const [adjustProduct, setAdjustProduct] = React.useState<Product | null>(null);
    const [adjustQuantity, setAdjustQuantity] = React.useState(0);
    const [adjustType, setAdjustType] = React.useState<"add" | "remove">("add");
    const [adjustReason, setAdjustReason] = React.useState("");
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                fetch("/api/products"),
                fetch("/api/categories"),
            ]);

            if (productsRes.ok) {
                const data = await productsRes.json();
                setProducts(data.products || []);
            }
            if (categoriesRes.ok) {
                const data = await categoriesRes.json();
                setCategories(data.categories || []);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const openAdjustDialog = (product: Product) => {
        setAdjustProduct(product);
        setAdjustQuantity(0);
        setAdjustType("add");
        setAdjustReason("");
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
                setProducts(
                    products.map((p) =>
                        p.id === adjustProduct.id ? { ...p, stock: newStock } : p
                    )
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

    const filteredProducts = products.filter((product) => {
        const matchesSearch =
            product.name.toLowerCase().includes(search.toLowerCase()) ||
            product.sku?.toLowerCase().includes(search.toLowerCase());

        const matchesCategory =
            categoryFilter === "all" || product.category?.id === categoryFilter;

        const matchesStock =
            stockFilter === "all" ||
            (stockFilter === "low" && product.stock <= product.lowStockAlert && product.stock > 0) ||
            (stockFilter === "out" && product.stock === 0) ||
            (stockFilter === "in" && product.stock > product.lowStockAlert);

        return matchesSearch && matchesCategory && matchesStock;
    });

    const getStockBadge = (product: Product) => {
        if (product.stock === 0) {
            return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Out of Stock</Badge>;
        }
        if (product.stock <= product.lowStockAlert) {
            return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Low Stock</Badge>;
        }
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">In Stock</Badge>;
    };

    // Stats
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const lowStockCount = products.filter((p) => p.stock <= p.lowStockAlert && p.stock > 0).length;
    const outOfStockCount = products.filter((p) => p.stock === 0).length;
    const inventoryValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Stock Management</h2>
                    <p className="text-muted-foreground">
                        Track and adjust inventory levels
                    </p>
                </div>
                <Link href="/dashboard/inventory/low-stock">
                    <Button variant="outline" className="border-yellow-500 text-yellow-600 hover:bg-yellow-50">
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Low Stock Alerts ({lowStockCount + outOfStockCount})
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-0 shadow-lg border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Units
                        </CardTitle>
                        <Package className="h-5 w-5 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalStock.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Across all products
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Inventory Value
                        </CardTitle>
                        <PackageCheck className="h-5 w-5 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{formatCurrency(inventoryValue)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            At retail prices
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg border-l-4 border-l-yellow-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Low Stock
                        </CardTitle>
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-yellow-600">{lowStockCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Below alert threshold
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
                            Need immediate restock
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Stock Table */}
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle>Inventory Levels</CardTitle>
                    <CardDescription>
                        Click on a product to adjust stock levels
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or SKU..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={stockFilter} onValueChange={setStockFilter}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="All Stock" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Stock</SelectItem>
                                <SelectItem value="in">In Stock</SelectItem>
                                <SelectItem value="low">Low Stock</SelectItem>
                                <SelectItem value="out">Out of Stock</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                            <Package className="h-12 w-12 mb-4" />
                            <p className="text-lg font-medium">No products found</p>
                            <p className="text-sm">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            Current Stock
                                            <ArrowUpDown className="h-4 w-4" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-right">Alert At</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Stock Value</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.map((product) => (
                                    <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {product.image ? (
                                                    <Image
                                                        src={product.image}
                                                        alt={product.name}
                                                        width={40}
                                                        height={40}
                                                        className="rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                                        <Package className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <span className="font-medium">{product.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {product.sku || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {product.category?.name || (
                                                <span className="text-muted-foreground">Uncategorized</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span
                                                className={`font-bold ${
                                                    product.stock === 0
                                                        ? "text-red-600"
                                                        : product.stock <= product.lowStockAlert
                                                        ? "text-yellow-600"
                                                        : ""
                                                }`}
                                            >
                                                {product.stock}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {product.lowStockAlert}
                                        </TableCell>
                                        <TableCell>{getStockBadge(product)}</TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(product.price * product.stock)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openAdjustDialog(product)}
                                            >
                                                <ArrowUpDown className="h-4 w-4 mr-1" />
                                                Adjust
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
                                    className={adjustType === "add" ? "bg-green-600 hover:bg-green-700 flex-1" : "flex-1"}
                                    onClick={() => setAdjustType("add")}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Stock
                                </Button>
                                <Button
                                    type="button"
                                    variant={adjustType === "remove" ? "default" : "outline"}
                                    className={adjustType === "remove" ? "bg-red-600 hover:bg-red-700 flex-1" : "flex-1"}
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

                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason (Optional)</Label>
                            <Input
                                id="reason"
                                value={adjustReason}
                                onChange={(e) => setAdjustReason(e.target.value)}
                                placeholder="e.g., Received shipment, Damaged goods..."
                            />
                        </div>

                        {adjustQuantity > 0 && adjustProduct && (
                            <div className={`flex items-center justify-between p-4 rounded-lg ${
                                adjustType === "add" ? "bg-green-50" : "bg-red-50"
                            }`}>
                                <span className={`text-sm ${adjustType === "add" ? "text-green-700" : "text-red-700"}`}>
                                    New Stock Level
                                </span>
                                <span className={`text-xl font-bold ${adjustType === "add" ? "text-green-700" : "text-red-700"}`}>
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
