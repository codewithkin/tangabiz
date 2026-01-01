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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2, Loader2, Search } from "lucide-react";
import Link from "next/link";

interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
}

interface Customer {
    id: string;
    name: string;
    email: string | null;
}

interface CartItem {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
}

export default function NewSalePage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [products, setProducts] = React.useState<Product[]>([]);
    const [customers, setCustomers] = React.useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [cart, setCart] = React.useState<CartItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = React.useState<string>("");
    const [paymentMethod, setPaymentMethod] = React.useState("cash");
    const [discount, setDiscount] = React.useState("0");
    const [tax, setTax] = React.useState("0");
    const [notes, setNotes] = React.useState("");

    React.useEffect(() => {
        fetchProducts();
        fetchCustomers();
    }, []);

    const fetchProducts = async (search?: string) => {
        try {
            const url = search
                ? `/api/products?search=${encodeURIComponent(search)}`
                : "/api/products";
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products || []);
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await fetch("/api/customers");
            if (res.ok) {
                const data = await res.json();
                setCustomers(data.customers || []);
            }
        } catch (error) {
            console.error("Failed to fetch customers:", error);
        }
    };

    const addToCart = (product: Product) => {
        const existingItem = cart.find((item) => item.productId === product.id);
        if (existingItem) {
            setCart(
                cart.map((item) =>
                    item.productId === product.id
                        ? {
                            ...item,
                            quantity: item.quantity + 1,
                            total: (item.quantity + 1) * item.unitPrice - item.discount,
                        }
                        : item
                )
            );
        } else {
            setCart([
                ...cart,
                {
                    productId: product.id,
                    name: product.name,
                    quantity: 1,
                    unitPrice: product.price,
                    discount: 0,
                    total: product.price,
                },
            ]);
        }
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart(
            cart.map((item) =>
                item.productId === productId
                    ? {
                        ...item,
                        quantity,
                        total: quantity * item.unitPrice - item.discount,
                    }
                    : item
            )
        );
    };

    const removeFromCart = (productId: string) => {
        setCart(cart.filter((item) => item.productId !== productId));
    };

    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = parseFloat(tax) || 0;
    const discountAmount = parseFloat(discount) || 0;
    const total = subtotal + taxAmount - discountAmount;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (cart.length === 0) {
            alert("Please add at least one item to the cart");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/sales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: cart.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        discount: item.discount,
                    })),
                    customerId: selectedCustomer || null,
                    paymentMethod,
                    discount: discountAmount,
                    tax: taxAmount,
                    notes,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to create sale");
            }

            router.push("/dashboard/sales");
        } catch (error) {
            console.error("Create sale error:", error);
            alert(error instanceof Error ? error.message : "Failed to create sale");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/sales">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">New Sale</h2>
                    <p className="text-muted-foreground">Create a new transaction</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Product Selection */}
                    <Card className="border-0 shadow-lg lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Products</CardTitle>
                            <CardDescription>
                                Search and add products to the sale
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search products..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        fetchProducts(e.target.value);
                                    }}
                                />
                            </div>

                            <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                                {products.map((product) => (
                                    <div
                                        key={product.id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                                        onClick={() => addToCart(product)}
                                    >
                                        <div>
                                            <p className="font-medium">{product.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Stock: {product.stock}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                                {formatCurrency(product.price)}
                                            </span>
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="outline"
                                                className="h-8 w-8"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {products.length === 0 && (
                                    <p className="text-center text-muted-foreground py-8">
                                        No products found
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cart Summary */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle>Cart</CardTitle>
                            <CardDescription>
                                {cart.length} item{cart.length !== 1 ? "s" : ""} in cart
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {cart.length > 0 ? (
                                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                    {cart.map((item) => (
                                        <div
                                            key={item.productId}
                                            className="flex items-center justify-between p-2 border rounded"
                                        >
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatCurrency(item.unitPrice)} each
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) =>
                                                        updateQuantity(
                                                            item.productId,
                                                            parseInt(e.target.value) || 0
                                                        )
                                                    }
                                                    className="w-16 h-8"
                                                />
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-red-500"
                                                    onClick={() => removeFromCart(item.productId)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">
                                    Cart is empty
                                </p>
                            )}

                            <div className="space-y-2 pt-4 border-t">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Tax</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={tax}
                                        onChange={(e) => setTax(e.target.value)}
                                        className="w-24 h-6 text-right"
                                    />
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Discount</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={discount}
                                        onChange={(e) => setDiscount(e.target.value)}
                                        className="w-24 h-6 text-right"
                                    />
                                </div>
                                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                    <span>Total</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Details */}
                    <Card className="border-0 shadow-lg lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Payment Details</CardTitle>
                            <CardDescription>
                                Customer and payment information
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="customer">Customer (Optional)</Label>
                                    <Select
                                        value={selectedCustomer}
                                        onValueChange={setSelectedCustomer}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Walk-in customer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Walk-in customer</SelectItem>
                                            {customers.map((customer) => (
                                                <SelectItem key={customer.id} value={customer.id}>
                                                    {customer.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Payment Method</Label>
                                    <div className="p-3 border rounded-lg bg-muted/50">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-medium">Cash Only</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Any additional notes..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={2}
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
                                    disabled={loading || cart.length === 0}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        `Complete Sale • ${formatCurrency(total)}`
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
