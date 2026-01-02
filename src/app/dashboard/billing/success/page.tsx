"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useActiveOrganization } from "@/lib/auth-client";

export default function BillingSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const checkoutId = searchParams.get("checkout_id");
    const { data: org, refetch } = useActiveOrganization();
    const [processing, setProcessing] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const syncPlan = async () => {
            if (!checkoutId) {
                setProcessing(false);
                return;
            }

            try {
                // Wait a moment for webhook to process
                await new Promise((resolve) => setTimeout(resolve, 2000));

                // Refetch organization to get updated plan
                await refetch();
                setProcessing(false);
            } catch (err) {
                console.error("Error syncing plan:", err);
                setError("Failed to sync subscription status. Please contact support if this persists.");
                setProcessing(false);
            }
        };

        syncPlan();
    }, [checkoutId, refetch]);

    if (processing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
                <Card className="w-full max-w-md">
                    <CardContent className="py-12 text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Processing your subscription...</h2>
                        <p className="text-muted-foreground">
                            Please wait while we activate your plan.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
                <Card className="w-full max-w-md">
                    <CardContent className="py-12 text-center">
                        <div className="text-red-500 text-5xl mb-4">⚠️</div>
                        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
                        <p className="text-muted-foreground mb-6">{error}</p>
                        <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4">
                        <CheckCircle2 className="h-16 w-16 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl">Welcome to {org?.name || "TangaBiz"}!</CardTitle>
                    <CardDescription>
                        Your subscription has been activated successfully.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                    {org && (
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm text-muted-foreground mb-1">Your Plan</p>
                            <p className="text-2xl font-bold text-green-700 capitalize">
                                {(org as any).plan || "Trial"}
                            </p>
                        </div>
                    )}

                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>✅ Your workspace is now fully activated</p>
                        <p>✅ All plan features are now available</p>
                        <p>✅ You can manage your subscription anytime</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700"
                            size="lg"
                            onClick={() => router.push("/dashboard")}
                        >
                            Go to Dashboard
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push("/dashboard/billing")}
                        >
                            Manage Subscription
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
