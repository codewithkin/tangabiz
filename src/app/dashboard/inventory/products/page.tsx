"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Plus,
    Search,
    Package,
    Loader2,
    MoreHorizontal,
    Pencil,
    Trash2,
    Eye,
    DollarSign,
    Tag,
    Minus,
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
    barcode: string | null;
    stock: number;
    lowStockAlert: number;
    price: number;
    cost: number | null;
    isActive: boolean;
    category: Category | null;
}

export default function ProductsPage() {
    const [products, setProducts] = React.useState<Product[]>([]);
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [categoryFilter, setCategoryFilter] = React.useState("all");
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [deleteId, setDeleteId] = React.useState<string | null>(null);
    const [deleting, setDeleting] = React.useState(false);
    const [adjustmentProduct, setAdjustmentProduct] = React.useState<Product | null>(null);
    const [adjustmentQuantity, setAdjustmentQuantity] = React.useState("0");
    const [adjusting, setAdjusting] = React.useState(false);

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

    const handleDelete = async () => {
        if (!deleteId) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/products/${deleteId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setProducts(products.filter((p) => p.id !== deleteId));
                setDeleteId(null);
            } else {
                const error = await res.json();
                alert(error.error || "Failed to delete product");
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("Failed to delete product");
        } finally {
            setDeleting(false);
        }
    };

    const handleAdjustment = async () => {
        if (!adjustmentProduct) return;

        const quantity = parseInt(adjustmentQuantity);
        if (isNaN(quantity)) {
            alert("Please enter a valid number");
            return;
        }

        setAdjusting(true);
        try {
            const res = await fetch(`/api/products/${adjustmentProduct.id}/stock`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ adjustment: quantity }),
            });

            if (res.ok) {
                const data = await res.json();
                setProducts(
                    products.map((p) =>
                        p.id === adjustmentProduct.id ? { ...p, stock: data.newStock } : p
                    )
                );
                setAdjustmentProduct(null);
                setAdjustmentQuantity("0");
            } else {
                const error = await res.json();
                alert(error.error || "Failed to adjust stock");
            }
        } catch (error) {
            console.error("Adjustment error:", error);
            alert("Failed to adjust stock");
        } finally {
            setAdjusting(false);
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
            product.sku?.toLowerCase().includes(search.toLowerCase()) ||
            product.barcode?.toLowerCase().includes(search.toLowerCase());

        const matchesCategory =
            categoryFilter === "all" || product.category?.id === categoryFilter;

        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "active" && product.isActive) ||
            (statusFilter === "inactive" && !product.isActive);

        return matchesSearch && matchesCategory && matchesStatus;
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
    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.isActive).length;
    const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Products</h2>
                    <p className="text-muted-foreground">
                        Manage your product catalog
                    </p>
                </div>
                <Link href="/dashboard/inventory/new">
                    <Button className="bg-green-600 hover:bg-green-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-0 shadow-lg border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Products
                        </CardTitle>
                        <Package className="h-5 w-5 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalProducts}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {activeProducts} active
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Categories
                        </CardTitle>
                        <Tag className="h-5 w-5 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{categories.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Product categories
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Inventory Value
                        </CardTitle>
                        <DollarSign className="h-5 w-5 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{formatCurrency(totalValue)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total stock value
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Search */}
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle>Product Catalog</CardTitle>
                    <CardDescription>
                        View and manage all your products
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, SKU, or barcode..."
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
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
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
                            <p className="text-sm">
                                {search || categoryFilter !== "all" || statusFilter !== "all"
                                    ? "Try adjusting your filters"
                                    : "Add your first product to get started"}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Stock</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.map((product) => (
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
                                                    {!product.isActive && (
                                                        <span className="text-xs text-red-500">Inactive</span>
                                                    )}
                                                </div>
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
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(product.price)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {product.stock}
                                        </TableCell>
                                        <TableCell>{getStockBadge(product)}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setAdjustmentProduct(product);
                                                            setAdjustmentQuantity("0");
                                                        }}
                                                    >
                                                        <Package className="h-4 w-4 mr-2" />
                                                        Adjust Stock
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/inventory/${product.id}/edit`}>
                                                            <Pencil className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={() => setDeleteId(product.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Product</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this product? This action cannot be undone.
                            If the product has sales history, it will be deactivated instead.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Stock Adjustment Dialog */}
            <Dialog open={!!adjustmentProduct} onOpenChange={() => adjustmentProduct && setAdjustmentProduct(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adjust Stock - {adjustmentProduct?.name}</DialogTitle>
                        <DialogDescription>
                            Current stock: <span className="font-bold text-foreground">{adjustmentProduct?.stock}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between gap-4">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => setAdjustmentQuantity(String(parseInt(adjustmentQuantity) - 1))}
                            >
                                <Minus className="h-5 w-5" />
                            </Button>
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground mb-1">Adjustment</p>
                                <Input
                                    type="number"
                                    value={adjustmentQuantity}
                                    onChange={(e) => setAdjustmentQuantity(e.target.value)}
                                    className="text-center text-lg font-bold"
                                    placeholder="0"
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => setAdjustmentQuantity(String(parseInt(adjustmentQuantity) + 1))}
                            >
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="border-t pt-3">
                            <p className="text-sm text-muted-foreground mb-2">New stock:</p>
                            <p className="text-2xl font-bold">
                                {(adjustmentProduct?.stock || 0) + (parseInt(adjustmentQuantity) || 0)}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAdjustmentProduct(null)} disabled={adjusting}>
                            Cancel
                        </Button>
                        <Button onClick={handleAdjustment} disabled={adjusting} className="bg-blue-600 hover:bg-blue-700">
                            {adjusting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adjusting...
                                </>
                            ) : (
                                "Apply Adjustment"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
