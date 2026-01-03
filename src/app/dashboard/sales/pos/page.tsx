"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    ArrowLeft,
    Plus,
    Minus,
    Trash2,
    Loader2,
    Search,
    ShoppingCart,
    User,
    CreditCard,
    Banknote,
    Smartphone,
    Check,
    Package,
    AlertTriangle,
    ChevronsUpDown,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    image: string | null;
    category: { name: string } | null;
}

interface Customer {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
}

interface CartItem {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    stock: number;
}

interface PlanLimitError {
    error: string;
    message: string;
    limitType: string;
    current: number;
    limit: number;
}

export default function POSPage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);
    const [products, setProducts] = React.useState<Product[]>([]);
    const [customers, setCustomers] = React.useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [cart, setCart] = React.useState<CartItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = React.useState<string>("");
    const [paymentMethod, setPaymentMethod] = React.useState("cash");
    const [showSuccess, setShowSuccess] = React.useState(false);
    const [lastReceipt, setLastReceipt] = React.useState<string>("");
    const [limitError, setLimitError] = React.useState<PlanLimitError | null>(null);
    const [customerSearchOpen, setCustomerSearchOpen] = React.useState(false);
    const [customerSearch, setCustomerSearch] = React.useState("");

    React.useEffect(() => {
        fetchProducts();
        fetchCustomers();
        checkLimits();
    }, []);

    // Check plan limits on mount
    const checkLimits = async () => {
        try {
            const res = await fetch("/api/billing/usage");
            const data = await res.json();

            if (data.limits && data.usage) {
                const maxMonthlySales = data.limits.maxMonthlySales;
                const currentMonthlySales = data.usage.monthlySales;

                // -1 means unlimited
                if (maxMonthlySales !== -1 && currentMonthlySales >= maxMonthlySales) {
                    setLimitError({
                        error: "Plan limit reached",
                        message: `You've reached your plan's limit of ${maxMonthlySales} sales this month. Please upgrade your plan to continue selling.`,
                        limitType: "monthlySales",
                        current: currentMonthlySales,
                        limit: maxMonthlySales,
                    });
                }
            }
        } catch (error) {
            console.error("Failed to check limits:", error);
        }
    };

    const fetchProducts = async (search?: string) => {
        setLoading(true);
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
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
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
            console.error("Error fetching customers:", error);
        }
    };

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        if (value.length >= 2) {
            fetchProducts(value);
        } else if (value.length === 0) {
            fetchProducts();
        }
    };

    const addToCart = (product: Product) => {
        const existingItem = cart.find((item) => item.productId === product.id);

        if (existingItem) {
            if (existingItem.quantity >= product.stock) {
                return; // Can't add more than stock
            }
            setCart(
                cart.map((item) =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            );
        } else {
            if (product.stock <= 0) return;
            setCart([
                ...cart,
                {
                    productId: product.id,
                    name: product.name,
                    quantity: 1,
                    unitPrice: product.price,
                    stock: product.stock,
                },
            ]);
        }
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(
            cart
                .map((item) => {
                    if (item.productId === productId) {
                        const newQuantity = item.quantity + delta;
                        if (newQuantity <= 0) return null;
                        if (newQuantity > item.stock) return item;
                        return { ...item, quantity: newQuantity };
                    }
                    return item;
                })
                .filter(Boolean) as CartItem[]
        );
    };

    const removeFromCart = (productId: string) => {
        setCart(cart.filter((item) => item.productId !== productId));
    };

    const subtotal = cart.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
    );
    const tax = 0;
    const discount = 0;
    const total = subtotal + tax - discount;

    const handleSubmit = async () => {
        if (cart.length === 0) return;

        setSubmitting(true);
        try {
            const res = await fetch("/api/sales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: cart.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        discount: 0,
                    })),
                    customerId: selectedCustomer || null,
                    paymentMethod,
                    tax,
                    discount,
                    notes: "",
                }),
            });

            if (!res.ok) {
                const error = await res.json();

                // Check if it's a plan limit error
                if (res.status === 403 && error.limitType) {
                    setLimitError(error as PlanLimitError);
                    return;
                }

                throw new Error(error.error || "Failed to complete sale");
            }

            const data = await res.json();
            setLastReceipt(data.sale.receiptNumber);
            setShowSuccess(true);
            setCart([]);
            setSelectedCustomer("");

            // Hide success message after 3 seconds
            setTimeout(() => {
                setShowSuccess(false);
            }, 3000);

            // Refresh products to update stock
            fetchProducts();
        } catch (error) {
            console.error("Sale error:", error);
            alert(error instanceof Error ? error.message : "Failed to complete sale");
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/sales">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">POS Terminal</h2>
                        <p className="text-muted-foreground">
                            Quick sales with barcode scanning support
                        </p>
                    </div>
                </div>
            </div>

            {/* Plan Limit Warning */}
            {limitError && (
                <Card className="border-amber-200 bg-amber-50 mb-4">
                    <CardContent className="flex items-start gap-4 pt-6">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-medium text-amber-900">Monthly Sales Limit Reached</h3>
                            <p className="text-sm text-amber-700 mt-1">{limitError.message}</p>
                            <p className="text-sm text-amber-600 mt-2">
                                Current: {limitError.current} / {limitError.limit} sales this month
                            </p>
                            <Link href="/dashboard/billing">
                                <Button className="mt-3 bg-amber-600 hover:bg-amber-700" size="sm">
                                    Upgrade Plan
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Success Message */}
            {showSuccess && (
                <div className="bg-green-100 border border-green-200 rounded-lg p-4 mb-4 flex items-center gap-3">
                    <div className="bg-green-500 rounded-full p-1">
                        <Check className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <p className="font-medium text-green-800">Sale Completed!</p>
                        <p className="text-sm text-green-600">Receipt: {lastReceipt}</p>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 grid gap-4 lg:grid-cols-3 overflow-hidden h-full">
                {/* Products Grid */}
                <Card className="border-0 shadow-lg lg:col-span-2 flex flex-col overflow-hidden h-full">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Products</CardTitle>
                                <CardDescription>Click to add to cart</CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search or scan barcode..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : products.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No products found</p>
                            </div>
                        ) : (
                            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                {products.map((product) => {
                                    const inCart = cart.find((item) => item.productId === product.id);
                                    return (
                                        <button
                                            key={product.id}
                                            onClick={() => addToCart(product)}
                                            disabled={product.stock <= 0}
                                            className={`p-3 rounded-lg border text-left transition-all relative ${product.stock <= 0
                                                ? "opacity-50 cursor-not-allowed bg-gray-50"
                                                : inCart
                                                    ? "border-green-500 bg-green-50"
                                                    : "hover:border-green-500 hover:shadow-md cursor-pointer"
                                                }`}
                                        >
                                            {inCart && (
                                                <div className="absolute -top-2 -right-2 bg-green-600 rounded-full p-1">
                                                    <Check className="h-3 w-3 text-white" />
                                                </div>
                                            )}
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-20 object-cover rounded mb-2"
                                                />
                                            ) : (
                                                <div className="w-full h-20 bg-gray-100 rounded mb-2 flex items-center justify-center">
                                                    <Package className="h-8 w-8 text-gray-400" />
                                                </div>
                                            )}
                                            <p className="font-medium text-sm truncate">{product.name}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-green-600 font-bold text-sm">
                                                    {formatCurrency(product.price)}
                                                </p>
                                                <Badge
                                                    variant={product.stock > 5 ? "outline" : "destructive"}
                                                    className="text-xs"
                                                >
                                                    {product.stock}
                                                </Badge>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Cart */}
                <Card className="border-0 shadow-lg flex flex-col overflow-hidden h-full">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5" />
                                    Cart
                                </CardTitle>
                                <CardDescription>
                                    {cart.length} item{cart.length !== 1 ? "s" : ""}
                                </CardDescription>
                            </div>
                            {cart.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCart([])}
                                    className="text-red-500 hover:text-red-600"
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col overflow-y-auto h-full">
                        {/* Cart Items */}
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">Cart is empty</p>
                                <p className="text-sm text-muted-foreground">
                                    Click products to add
                                </p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div
                                    key={item.productId}
                                    className="p-3 rounded-lg border bg-white"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm">
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatCurrency(item.unitPrice)} each
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-red-500 -mt-1 -mr-1"
                                            onClick={() => removeFromCart(item.productId)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 hover:bg-white"
                                                onClick={() => updateQuantity(item.productId, -1)}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="w-10 text-center font-medium text-sm">
                                                {item.quantity}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 hover:bg-white"
                                                onClick={() => updateQuantity(item.productId, 1)}
                                                disabled={item.quantity >= item.stock}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <p className="font-bold text-base text-green-600">
                                            {formatCurrency(item.unitPrice * item.quantity)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Customer Selection */}
                        <div className="space-y-3 border-t pt-3">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    Customer
                                </Label>
                                <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={customerSearchOpen}
                                            className="w-full justify-between"
                                        >
                                            {selectedCustomer && selectedCustomer !== "walk-in"
                                                ? customers.find((c) => c.id === selectedCustomer)?.name
                                                : "Walk-in Customer"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0" align="start">
                                        <Command>
                                            <CommandInput
                                                placeholder="Search customers..."
                                                value={customerSearch}
                                                onValueChange={setCustomerSearch}
                                            />
                                            <CommandList>
                                                <CommandEmpty>No customer found.</CommandEmpty>
                                                <CommandGroup>
                                                    <CommandItem
                                                        value="walk-in"
                                                        onSelect={() => {
                                                            setSelectedCustomer("walk-in");
                                                            setCustomerSearchOpen(false);
                                                            setCustomerSearch("");
                                                        }}
                                                    >
                                                        <Check
                                                            className={`mr-2 h-4 w-4 ${selectedCustomer === "walk-in" ? "opacity-100" : "opacity-0"
                                                                }`}
                                                        />
                                                        Walk-in Customer
                                                    </CommandItem>
                                                    {customers.map((customer) => (
                                                        <CommandItem
                                                            key={customer.id}
                                                            value={customer.name}
                                                            onSelect={() => {
                                                                setSelectedCustomer(customer.id);
                                                                setCustomerSearchOpen(false);
                                                                setCustomerSearch("");
                                                            }}
                                                        >
                                                            <Check
                                                                className={`mr-2 h-4 w-4 ${selectedCustomer === customer.id ? "opacity-100" : "opacity-0"
                                                                    }`}
                                                            />
                                                            <div className="flex-1">
                                                                <div className="font-medium">{customer.name}</div>
                                                                {customer.email && (
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {customer.email}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Payment Method */}
                            <div className="space-y-2">
                                <Label>Payment Method</Label>
                                <div className="p-3 border rounded-lg bg-green-50">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Banknote className="h-4 w-4 text-green-600" />
                                        <span className="font-medium">Cash Only</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="border-t pt-3 mt-3 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold">
                                <span>Total</span>
                                <span className="text-green-600">{formatCurrency(total)}</span>
                            </div>
                        </div>

                        {/* Complete Sale Button */}
                        <Button
                            className="w-full mt-4 bg-green-600 hover:bg-green-700 h-12 text-base"
                            onClick={handleSubmit}
                            disabled={cart.length === 0 || submitting || !!limitError}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Processing...
                                </>
                            ) : limitError ? (
                                <>
                                    <AlertTriangle className="mr-2 h-5 w-5" />
                                    Limit Reached
                                </>
                            ) : (
                                <>
                                    <Check className="mr-2 h-5 w-5" />
                                    Complete Sale
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}
