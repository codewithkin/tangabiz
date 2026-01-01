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
    Plus,
    Search,
    Loader2,
    Package,
    MoreHorizontal,
    Edit,
    Trash2,
    AlertTriangle,
    TrendingDown,
    DollarSign,
    Boxes,
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
    description: string | null;
    sku: string | null;
    barcode: string | null;
    image: string | null;
    price: number;
    cost: number | null;
    stock: number;
    lowStockAlert: number;
    isActive: boolean;
    category: Category | null;
    createdAt: string;
}

export default function InventoryPage() {
    const [products, setProducts] = React.useState<Product[]>([]);
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [categoryFilter, setCategoryFilter] = React.useState("all");
    const [stockFilter, setStockFilter] = React.useState("all");
    const [deleteProduct, setDeleteProduct] = React.useState<Product | null>(null);
    const [deleting, setDeleting] = React.useState(false);

    React.useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/products");
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

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/categories");
            if (res.ok) {
                const data = await res.json();
                setCategories(data.categories || []);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const handleDelete = async () => {
        if (!deleteProduct) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/products/${deleteProduct.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setProducts(products.filter((p) => p.id !== deleteProduct.id));
                setDeleteProduct(null);
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

    const filteredProducts = products.filter((product) => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.barcode?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
            categoryFilter === "all" || product.category?.id === categoryFilter;

        const matchesStock =
            stockFilter === "all" ||
            (stockFilter === "low" && product.stock <= product.lowStockAlert) ||
            (stockFilter === "out" && product.stock === 0) ||
            (stockFilter === "in" && product.stock > product.lowStockAlert);

        return matchesSearch && matchesCategory && matchesStock;
    });

    // Stats
    const totalProducts = products.length;
    const lowStockProducts = products.filter((p) => p.stock <= p.lowStockAlert && p.stock > 0).length;
    const outOfStockProducts = products.filter((p) => p.stock === 0).length;
    const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

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
        if (product.stock <= product.lowStockAlert) {
            return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Low Stock</Badge>;
        }
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">In Stock</Badge>;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
                    <p className="text-muted-foreground">
                        Manage your products and stock levels
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/inventory/categories">
                        <Button variant="outline">
                            <Boxes className="mr-2 h-4 w-4" />
                            Categories
                        </Button>
                    </Link>
                    <Link href="/dashboard/products/new">
                        <Button className="bg-green-600 hover:bg-green-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Products
                        </CardTitle>
                        <Package className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProducts}</div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Low Stock Items
                        </CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{lowStockProducts}</div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Out of Stock
                        </CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{outOfStockProducts}</div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Inventory Value
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Products Table */}
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div>
                            <CardTitle>Products</CardTitle>
                            <CardDescription>
                                {filteredProducts.length} products found
                            </CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search products..."
                                    className="pl-10 w-full sm:w-64"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full sm:w-40">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={stockFilter} onValueChange={setStockFilter}>
                                <SelectTrigger className="w-full sm:w-36">
                                    <SelectValue placeholder="Stock" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Stock</SelectItem>
                                    <SelectItem value="in">In Stock</SelectItem>
                                    <SelectItem value="low">Low Stock</SelectItem>
                                    <SelectItem value="out">Out of Stock</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                            <Package className="h-12 w-12 mb-4" />
                            <p className="text-lg font-medium">No products found</p>
                            <p className="text-sm">
                                {products.length === 0
                                    ? "Add your first product to get started"
                                    : "Try adjusting your filters"}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-right">Stock</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProducts.map((product) => (
                                        <TableRow key={product.id}>
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
                                                    <div>
                                                        <div className="font-medium">{product.name}</div>
                                                        {product.barcode && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {product.barcode}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {product.sku || "—"}
                                            </TableCell>
                                            <TableCell>
                                                {product.category?.name || "Uncategorized"}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(product.price)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span
                                                    className={
                                                        product.stock <= product.lowStockAlert
                                                            ? product.stock === 0
                                                                ? "text-red-600 font-medium"
                                                                : "text-yellow-600 font-medium"
                                                            : ""
                                                    }
                                                >
                                                    {product.stock}
                                                </span>
                                            </TableCell>
                                            <TableCell>{getStockBadge(product)}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/dashboard/inventory/${product.id}/edit`}>
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => setDeleteProduct(product)}
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
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Product</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{deleteProduct?.name}&quot;? This action
                            cannot be undone.
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
        </div>
    );
}
