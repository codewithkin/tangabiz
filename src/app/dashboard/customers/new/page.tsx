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
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface PlanLimitError {
    error: string;
    message: string;
    limitType: string;
    current: number;
    limit: number;
}

export default function NewCustomerPage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [limitError, setLimitError] = React.useState<PlanLimitError | null>(null);

    const [formData, setFormData] = React.useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
    });

    // Check plan limits on mount
    React.useEffect(() => {
        const checkLimits = async () => {
            try {
                const res = await fetch("/api/billing/usage");
                const data = await res.json();

                if (data.limits && data.usage) {
                    const maxCustomers = data.limits.maxCustomers;
                    const currentCustomers = data.usage.customers;

                    // -1 means unlimited
                    if (maxCustomers !== -1 && currentCustomers >= maxCustomers) {
                        setLimitError({
                            error: "Plan limit reached",
                            message: `You've reached your plan's limit of ${maxCustomers} customers. Please upgrade your plan to add more.`,
                            limitType: "customers",
                            current: currentCustomers,
                            limit: maxCustomers,
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to check limits:", error);
            }
        };

        checkLimits();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/customers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const error = await res.json();

                // Check if it's a plan limit error
                if (res.status === 403 && error.limitType) {
                    setLimitError(error as PlanLimitError);
                    return;
                }

                throw new Error(error.error || "Failed to create customer");
            }

            router.push("/dashboard/customers");
        } catch (error) {
            console.error("Create customer error:", error);
            alert(error instanceof Error ? error.message : "Failed to create customer");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/customers">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Add New Customer</h2>
                    <p className="text-muted-foreground">
                        Add a new customer to your database
                    </p>
                </div>
            </div>

            {/* Plan Limit Warning */}
            {limitError && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="flex items-start gap-4 pt-6">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-medium text-amber-900">Customer Limit Reached</h3>
                            <p className="text-sm text-amber-700 mt-1">{limitError.message}</p>
                            <p className="text-sm text-amber-600 mt-2">
                                Current: {limitError.current} / {limitError.limit} customers
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

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Customer Info */}
                    <Card className="border-0 shadow-lg lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Customer Information</CardTitle>
                            <CardDescription>
                                Basic contact details
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="Enter customer name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    required
                                    disabled={!!limitError}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="customer@example.com"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+1 (555) 123-4567"
                                        value={formData.phone}
                                        onChange={(e) =>
                                            setFormData({ ...formData, phone: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea
                                    id="address"
                                    placeholder="Street address, city, state, zip..."
                                    value={formData.address}
                                    onChange={(e) =>
                                        setFormData({ ...formData, address: e.target.value })
                                    }
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Any additional notes about this customer..."
                                    value={formData.notes}
                                    onChange={(e) =>
                                        setFormData({ ...formData, notes: e.target.value })
                                    }
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card className="border-0 shadow-lg h-fit">
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                            <CardDescription>
                                Save or cancel changes
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-2">
                                <Button
                                    type="submit"
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    disabled={loading || !!limitError}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : limitError ? (
                                        "Limit Reached"
                                    ) : (
                                        "Create Customer"
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
