"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Sparkles, Zap, Crown } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import {
    getAllPlans,
    formatLimit,
    FEATURE_NAMES,
    type Plan,
    TRIAL_DURATION_DAYS,
} from "@/lib/plans";

const PLAN_ICONS = {
    starter: Sparkles,
    growth: Zap,
    enterprise: Crown,
};

const PLAN_COLORS = {
    starter: "border-blue-200 bg-blue-50/50",
    growth: "border-green-200 bg-green-50/50 ring-2 ring-green-500",
    enterprise: "border-purple-200 bg-purple-50/50",
};

export default function SelectPlanPage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState<string | null>(null);
    const plans = getAllPlans();

    const handleSelectPlan = async (plan: Plan) => {
        setLoading(plan.id);
        try {
            // Start checkout with Polar
            await authClient.checkout({
                slug: plan.id,
            });
        } catch (error) {
            console.error("Checkout error:", error);
            // If checkout fails, try updating plan directly (for trial)
            try {
                const res = await fetch("/api/billing/plan", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ plan: plan.id }),
                });

                if (res.ok) {
                    router.push("/dashboard");
                } else {
                    alert("Failed to select plan. Please try again.");
                }
            } catch (e) {
                console.error("Plan update error:", e);
                alert("Failed to select plan. Please try again.");
            }
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">
                        <span className="text-yellow-500">Choose</span>{" "}
                        <span className="text-green-600">Your Plan</span>
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Start with a {TRIAL_DURATION_DAYS}-day free trial on any plan. No credit card required.
                        Cancel anytime.
                    </p>
                </div>

                {/* Plans Grid */}
                <div className="grid gap-6 md:grid-cols-3">
                    {plans.map((plan) => {
                        const Icon = PLAN_ICONS[plan.id];
                        return (
                            <Card
                                key={plan.id}
                                className={`relative border-2 ${PLAN_COLORS[plan.id]} transition-all hover:shadow-lg`}
                            >
                                {plan.popular && (
                                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600">
                                        Most Popular
                                    </Badge>
                                )}

                                <CardHeader className="text-center pb-2">
                                    <div className="mx-auto mb-4 p-3 rounded-full bg-white shadow-sm">
                                        <Icon className={`h-8 w-8 ${plan.id === "starter" ? "text-blue-500" :
                                                plan.id === "growth" ? "text-green-500" :
                                                    "text-purple-500"
                                            }`} />
                                    </div>
                                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                    <CardDescription>{plan.description}</CardDescription>
                                </CardHeader>

                                <CardContent className="text-center">
                                    <div className="mb-6">
                                        <span className="text-4xl font-bold">${plan.price}</span>
                                        <span className="text-muted-foreground">/month</span>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            or ${plan.yearlyPrice}/year (save 2 months)
                                        </p>
                                    </div>

                                    {/* Limits */}
                                    <div className="space-y-3 text-left mb-6">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Products</span>
                                            <span className="font-medium">{formatLimit(plan.limits.maxProducts)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Customers</span>
                                            <span className="font-medium">{formatLimit(plan.limits.maxCustomers)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Team Members</span>
                                            <span className="font-medium">{formatLimit(plan.limits.maxTeamMembers)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Monthly Sales</span>
                                            <span className="font-medium">{formatLimit(plan.limits.maxMonthlySales)}</span>
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <div className="space-y-2 text-left border-t pt-4">
                                        {Object.entries(plan.limits.features).map(([key, enabled]) => (
                                            <div
                                                key={key}
                                                className={`flex items-center gap-2 text-sm ${enabled ? "" : "text-muted-foreground line-through"
                                                    }`}
                                            >
                                                <Check
                                                    className={`h-4 w-4 ${enabled ? "text-green-500" : "text-gray-300"
                                                        }`}
                                                />
                                                <span>{FEATURE_NAMES[key as keyof typeof FEATURE_NAMES]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>

                                <CardFooter>
                                    <Button
                                        className={`w-full ${plan.id === "growth"
                                                ? "bg-green-600 hover:bg-green-700"
                                                : plan.id === "enterprise"
                                                    ? "bg-purple-600 hover:bg-purple-700"
                                                    : "bg-blue-600 hover:bg-blue-700"
                                            }`}
                                        size="lg"
                                        onClick={() => handleSelectPlan(plan)}
                                        disabled={loading !== null}
                                    >
                                        {loading === plan.id ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>Start {TRIAL_DURATION_DAYS}-Day Free Trial</>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>

                {/* Footer note */}
                <p className="text-center text-sm text-muted-foreground mt-8">
                    All plans include a {TRIAL_DURATION_DAYS}-day free trial. You won't be charged until the trial ends.
                    <br />
                    Need help choosing? <a href="mailto:support@tangabiz.com" className="text-green-600 hover:underline">Contact us</a>
                </p>
            </div>
        </div>
    );
}
