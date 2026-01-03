"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface PlanLimitError {
    error: string;
    message: string;
    limitType: string;
    current: number;
    limit: number;
}

interface NewCustomerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function NewCustomerDialog({ open, onOpenChange, onSuccess }: NewCustomerDialogProps) {
    const [loading, setLoading] = React.useState(false);
    const [limitError, setLimitError] = React.useState<PlanLimitError | null>(null);
    const [formData, setFormData] = React.useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
    });

    // Check plan limits when dialog opens
    React.useEffect(() => {
        if (!open) return;

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
                    } else {
                        setLimitError(null);
                    }
                }
            } catch (error) {
                console.error("Failed to check limits:", error);
            }
        };

        checkLimits();
    }, [open]);

    // Reset form when dialog closes
    React.useEffect(() => {
        if (!open) {
            setFormData({
                name: "",
                email: "",
                phone: "",
                address: "",
                notes: "",
            });
            setLimitError(null);
        }
    }, [open]);

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

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Create customer error:", error);
            alert(error instanceof Error ? error.message : "Failed to create customer");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Customer</DialogTitle>
                    <DialogDescription>
                        Add a new customer to your database
                    </DialogDescription>
                </DialogHeader>

                {/* Plan Limit Warning */}
                {limitError && (
                    <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                        <div className="flex-1">
                            <h3 className="font-medium text-amber-900 text-sm">Customer Limit Reached</h3>
                            <p className="text-sm text-amber-700 mt-1">{limitError.message}</p>
                            <p className="text-sm text-amber-600 mt-2">
                                Current: {limitError.current} / {limitError.limit} customers
                            </p>
                            <Link href="/dashboard/billing" onClick={() => onOpenChange(false)}>
                                <Button className="mt-3 bg-amber-600 hover:bg-amber-700" size="sm">
                                    Upgrade Plan
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
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
                                    disabled={!!limitError}
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
                                    disabled={!!limitError}
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
                                disabled={!!limitError}
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
                                disabled={!!limitError}
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700"
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
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
