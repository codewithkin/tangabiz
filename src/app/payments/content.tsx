"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSessionRedirect } from "@/lib/use-session-redirect";
import { useActiveOrganization } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPlan } from "@/lib/plans";

interface SubscriptionInfo {
    plan: string;
    isYearly: boolean;
    subscription: {
        id: string;
        status: string;
        currentPeriodEnd: string;
        productName?: string;
    };
}

export default function PaymentsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    useSessionRedirect(true);
    const { data: org, refetch } = useActiveOrganization();

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [error, setError] = useState<string | null>(null);
    const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);

    const plan = subscriptionInfo?.plan ? getPlan(subscriptionInfo.plan) : null;

    useEffect(() => {
        const verifySubscription = async () => {
            console.log("[Payments] Starting subscription verification");
            const statusParam = searchParams.get("status");
            const customerSessionToken = searchParams.get("customer_session_token");
            console.log("[Payments] URL params:", { statusParam, hasToken: !!customerSessionToken });

            // If status is explicitly error, show error
            if (statusParam === "error") {
                console.log("[Payments] Status param indicates error");
                setStatus("error");
                setError("Payment was not completed. Please try again.");
                return;
            }

            // If no customer session token, we can't verify
            if (!customerSessionToken) {
                console.log("[Payments] No customer session token found");
                setStatus("error");
                setError("Missing payment verification data. Please try subscribing again.");
                return;
            }

            try {
                console.log("[Payments] Calling verify-subscription API");
                // Call our API to verify the subscription and update the org
                const response = await fetch("/api/billing/verify-subscription", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ customerSessionToken }),
                });

                const data = await response.json();
                console.log("[Payments] API response:", { ok: response.ok, status: response.status, data });

                if (!response.ok) {
                    console.error("[Payments] Verification error:", data);
                    setError(data.error || "Failed to verify subscription. Please contact support.");
                    setStatus("error");
                    return;
                }

                // Success! Store subscription info
                console.log("[Payments] Verification successful, storing subscription info");
                setSubscriptionInfo(data);
                setStatus("success");

                // Refetch org to get updated plan
                console.log("[Payments] Refetching organization data");
                await refetch();
                console.log("[Payments] Organization data refetched");
            } catch (err) {
                console.error("[Payments] Error verifying subscription:", err);
                setError("An unexpected error occurred. Please contact support.");
                setStatus("error");
            }
        };

        verifySubscription();
    }, [searchParams, refetch]);

    // Loading state
    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 p-8">
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 -left-40 w-80 h-80 bg-green-600/10 rounded-full blur-3xl" />
                </div>

                <div className="relative w-full max-w-md">
                    <Card className="border-0 shadow-xl">
                        <CardHeader className="text-center pb-4">
                            <div className="text-base font-bold mx-auto mb-6">
                                <span className="text-yellow-400">Tanga</span>
                                <span className="text-green-600">biz</span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8 py-8 text-center">
                            {/* Animated Loader */}
                            <div className="flex justify-center">
                                <div className="relative w-20 h-20">
                                    <div className="absolute inset-0 rounded-full bg-linear-to-r from-green-500 to-emerald-500 opacity-20 animate-pulse" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
                                    </div>
                                </div>
                            </div>

                            {/* Text Content */}
                            <div className="space-y-3">
                                <h2 className="text-2xl font-bold text-foreground">Verifying Payment</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    We&apos;re confirming your subscription with Polar and activating your plan.
                                </p>
                            </div>

                            {/* Progress indicator */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    <span>Payment received</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <div className="h-2 w-2 rounded-full bg-green-500/50 animate-pulse" />
                                    <span>Verifying subscription</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <div className="h-2 w-2 rounded-full bg-gray-300" />
                                    <span>Activating plan</span>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground pt-4">
                                This typically takes a few seconds...
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 -left-40 w-80 h-80 bg-green-600/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                <Card className="border-0 shadow-lg">
                    <CardHeader className="text-center">
                        <div className="text-base font-bold mx-auto mb-6">
                            <span className="text-yellow-400">Tanga</span>
                            <span className="text-green-600">biz</span>
                        </div>

                        {status === "success" ? (
                            <>
                                <div className="flex justify-center mb-4">
                                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                                    </div>
                                </div>
                                <CardTitle className="text-2xl">Payment Successful!</CardTitle>
                                <CardDescription>
                                    {org?.name} is now on the <span className="font-semibold text-green-600">{plan?.name}</span> plan
                                    {subscriptionInfo?.isYearly ? " (Yearly)" : " (Monthly)"}.
                                </CardDescription>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-center mb-4">
                                    <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                                        <AlertCircle className="h-8 w-8 text-red-600" />
                                    </div>
                                </div>
                                <CardTitle className="text-2xl">Payment Failed</CardTitle>
                                <CardDescription>
                                    {error || "We couldn't process your payment. Please try again."}
                                </CardDescription>
                            </>
                        )}
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {status === "success" ? (
                            <>
                                {/* Plan summary */}
                                {plan && (
                                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-muted-foreground">Your Plan</span>
                                            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                                                {subscriptionInfo?.subscription.status === "active" ? "Active" : "Trialing"}
                                            </span>
                                        </div>
                                        <p className="text-2xl font-bold text-green-700">{plan.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            ${subscriptionInfo?.isYearly ? plan.yearlyPrice : plan.price}
                                            {subscriptionInfo?.isYearly ? "/year" : "/month"}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-3 bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-green-900">What&apos;s next?</h3>
                                    <ul className="space-y-2 text-sm text-green-800">
                                        <li className="flex gap-2">
                                            <span>✓</span>
                                            <span>Invite your team members</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span>✓</span>
                                            <span>Set up your products and categories</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span>✓</span>
                                            <span>Start accepting sales</span>
                                        </li>
                                    </ul>
                                </div>

                                <Button
                                    onClick={() => router.push("/onboarding/business/?step=3")}
                                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
                                >
                                    Finish Onboarding
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>

                                <p className="text-xs text-center text-muted-foreground">
                                    You can always manage your subscription from the billing page.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="space-y-3 bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="text-sm text-red-800">
                                        {error || "Please check your payment details and try again. If the problem persists, contact support."}
                                    </p>
                                </div>

                                <Button
                                    onClick={() => router.push("/onboarding/business?step=2")}
                                    className="w-full h-12 bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Try Again
                                </Button>

                                <Button
                                    onClick={() => router.push("/dashboard")}
                                    variant="outline"
                                    className="w-full h-12"
                                >
                                    Go to Dashboard
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
