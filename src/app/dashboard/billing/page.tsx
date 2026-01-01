"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    Check,
    Loader2,
    Sparkles,
    Zap,
    Crown,
    AlertTriangle,
    CreditCard,
    Calendar,
    ExternalLink,
} from "lucide-react";
import { useActiveOrganization, authClient } from "@/lib/auth-client";
import {
    getPlan,
    getAllPlans,
    formatLimit,
    FEATURE_NAMES,
    getTrialDaysRemaining,
    isTrialActive,
    TRIAL_DURATION_DAYS,
    type Plan,
    type PlanType,
} from "@/lib/plans";

const PLAN_ICONS = {
    starter: Sparkles,
    growth: Zap,
    enterprise: Crown,
};

const PLAN_COLORS = {
    starter: "text-blue-500",
    growth: "text-green-500",
    enterprise: "text-purple-500",
};

interface UsageData {
    productCount: number;
    customerCount: number;
    teamMemberCount: number;
    monthlySalesCount: number;
}

export default function BillingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const expired = searchParams.get("expired") === "true";
    const { data: org, isPending } = useActiveOrganization();
    const [usage, setUsage] = React.useState<UsageData | null>(null);
    const [loading, setLoading] = React.useState<string | null>(null);

    const orgData = org as any;
    const planId = orgData?.plan as PlanType | null;
    const planStartedAt = orgData?.planStartedAt as string | null;
    const currentPlan = planId ? getPlan(planId) : null;
    const trialDaysRemaining = planStartedAt ? getTrialDaysRemaining(planStartedAt) : 0;
    const isInTrial = planStartedAt ? isTrialActive(planStartedAt) : false;
    const allPlans = getAllPlans();

    React.useEffect(() => {
        const fetchUsage = async () => {
            try {
                const res = await fetch("/api/billing/plan");
                if (res.ok) {
                    const data = await res.json();
                    setUsage(data.usage);
                }
            } catch (error) {
                console.error("Failed to fetch usage:", error);
            }
        };

        if (org) {
            fetchUsage();
        }
    }, [org]);

    const handleUpgrade = async (plan: Plan) => {
        setLoading(plan.id);
        try {
            await authClient.checkout({
                slug: plan.id,
            });
        } catch (error) {
            console.error("Checkout error:", error);
            // Fallback to direct update for trial
            try {
                const res = await fetch("/api/billing/plan", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ plan: plan.id }),
                });

                if (res.ok) {
                    window.location.reload();
                }
            } catch (e) {
                console.error("Plan update error:", e);
            }
        } finally {
            setLoading(null);
        }
    };

    const getUsagePercent = (used: number, limit: number): number => {
        if (limit === -1) return 0;
        return Math.min(100, Math.round((used / limit) * 100));
    };

    if (isPending) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Billing & Subscription</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your subscription and view usage
                </p>
            </div>

            {/* Trial Expired Warning */}
            {expired && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-red-800">Trial Expired</h3>
                                <p className="text-sm text-red-600">
                                    Your {TRIAL_DURATION_DAYS}-day trial has ended. Please select a plan to continue using TangaBiz.
                                </p>
                            </div>
                            <Button onClick={() => router.push("/dashboard/select-plan")}>
                                Select Plan
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Current Plan */}
            {currentPlan && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {(() => {
                                    const Icon = PLAN_ICONS[currentPlan.id];
                                    return (
                                        <div className={`p-3 rounded-lg ${currentPlan.id === "starter" ? "bg-blue-100" :
                                                currentPlan.id === "growth" ? "bg-green-100" : "bg-purple-100"
                                            }`}>
                                            <Icon className={`h-6 w-6 ${PLAN_COLORS[currentPlan.id]}`} />
                                        </div>
                                    );
                                })()}
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        {currentPlan.name} Plan
                                        {isInTrial && (
                                            <Badge variant="outline" className="ml-2">
                                                Trial: {trialDaysRemaining} days left
                                            </Badge>
                                        )}
                                    </CardTitle>
                                    <CardDescription>{currentPlan.description}</CardDescription>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold">${currentPlan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                                <p className="text-sm text-muted-foreground">or ${currentPlan.yearlyPrice}/year</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Usage */}
                        {usage && (
                            <>
                                <Separator />
                                <div className="space-y-4">
                                    <h4 className="font-semibold">Usage</h4>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Products</span>
                                                <span>
                                                    {usage.productCount} / {formatLimit(currentPlan.limits.maxProducts)}
                                                </span>
                                            </div>
                                            <Progress
                                                value={getUsagePercent(usage.productCount, currentPlan.limits.maxProducts)}
                                                className="h-2"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Customers</span>
                                                <span>
                                                    {usage.customerCount} / {formatLimit(currentPlan.limits.maxCustomers)}
                                                </span>
                                            </div>
                                            <Progress
                                                value={getUsagePercent(usage.customerCount, currentPlan.limits.maxCustomers)}
                                                className="h-2"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Team Members</span>
                                                <span>
                                                    {usage.teamMemberCount} / {formatLimit(currentPlan.limits.maxTeamMembers)}
                                                </span>
                                            </div>
                                            <Progress
                                                value={getUsagePercent(usage.teamMemberCount, currentPlan.limits.maxTeamMembers)}
                                                className="h-2"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Monthly Sales</span>
                                                <span>
                                                    {usage.monthlySalesCount} / {formatLimit(currentPlan.limits.maxMonthlySales)}
                                                </span>
                                            </div>
                                            <Progress
                                                value={getUsagePercent(usage.monthlySalesCount, currentPlan.limits.maxMonthlySales)}
                                                className="h-2"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Features */}
                        <Separator />
                        <div className="space-y-4">
                            <h4 className="font-semibold">Features</h4>
                            <div className="grid gap-2 md:grid-cols-2">
                                {Object.entries(currentPlan.limits.features).map(([key, enabled]) => (
                                    <div
                                        key={key}
                                        className={`flex items-center gap-2 text-sm ${enabled ? "" : "text-muted-foreground line-through"
                                            }`}
                                    >
                                        <Check className={`h-4 w-4 ${enabled ? "text-green-500" : "text-gray-300"}`} />
                                        <span>{FEATURE_NAMES[key as keyof typeof FEATURE_NAMES]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <Separator />
                        <div className="flex items-center gap-4">
                            <Button variant="outline" asChild>
                                <a href="https://polar.sh/settings/subscriptions" target="_blank" rel="noopener noreferrer">
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Manage Subscription
                                    <ExternalLink className="h-3 w-3 ml-2" />
                                </a>
                            </Button>
                            {currentPlan.id !== "enterprise" && (
                                <Button onClick={() => router.push("/dashboard/select-plan")}>
                                    Upgrade Plan
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* No Plan */}
            {!currentPlan && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="py-8 text-center">
                        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Active Plan</h3>
                        <p className="text-muted-foreground mb-6">
                            Select a plan to start using all of TangaBiz's features.
                        </p>
                        <Button onClick={() => router.push("/dashboard/select-plan")} size="lg">
                            Choose a Plan
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* All Plans Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle>All Plans</CardTitle>
                    <CardDescription>Compare features across all plans</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        {allPlans.map((plan) => {
                            const Icon = PLAN_ICONS[plan.id];
                            const isCurrent = planId === plan.id;
                            const isUpgrade = !planId ||
                                (planId === "starter" && (plan.id === "growth" || plan.id === "enterprise")) ||
                                (planId === "growth" && plan.id === "enterprise");

                            return (
                                <Card key={plan.id} className={`relative ${isCurrent ? "border-green-500 border-2" : ""}`}>
                                    {plan.popular && (
                                        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-600">
                                            Popular
                                        </Badge>
                                    )}
                                    {isCurrent && (
                                        <Badge className="absolute -top-2 right-4 bg-blue-600">
                                            Current
                                        </Badge>
                                    )}

                                    <CardHeader className="text-center pb-2">
                                        <Icon className={`h-8 w-8 mx-auto ${PLAN_COLORS[plan.id]}`} />
                                        <CardTitle>{plan.name}</CardTitle>
                                        <div className="mt-2">
                                            <span className="text-3xl font-bold">${plan.price}</span>
                                            <span className="text-muted-foreground">/mo</span>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Products</span>
                                                <span className="font-medium">{formatLimit(plan.limits.maxProducts)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Customers</span>
                                                <span className="font-medium">{formatLimit(plan.limits.maxCustomers)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Team</span>
                                                <span className="font-medium">{formatLimit(plan.limits.maxTeamMembers)}</span>
                                            </div>
                                        </div>

                                        <Button
                                            className="w-full"
                                            variant={isCurrent ? "outline" : "default"}
                                            disabled={isCurrent || loading !== null}
                                            onClick={() => handleUpgrade(plan)}
                                        >
                                            {loading === plan.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : isCurrent ? (
                                                "Current Plan"
                                            ) : isUpgrade ? (
                                                "Upgrade"
                                            ) : (
                                                "Downgrade"
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
