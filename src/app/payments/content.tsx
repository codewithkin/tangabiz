"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSessionRedirect } from "@/lib/use-session-redirect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    useSessionRedirect(true);

    const [status, setStatus] = useState<"success" | "error">("success");

    useEffect(() => {
        const statusParam = searchParams.get("status");
        if (statusParam === "error") {
            setStatus("error");
        }
    }, [searchParams]);

    const handleReturnToOnboarding = () => {
        router.push("/onboarding/business?step=3");
    };

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
                                    Your subscription is now active. Let&apos;s finish setting up your shop.
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
                                    We couldn&apos;t process your payment. Please try again.
                                </CardDescription>
                            </>
                        )}
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {status === "success" ? (
                            <>
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
                                    onClick={handleReturnToOnboarding}
                                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
                                >
                                    Return to Onboarding
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
                                        Please check your payment details and try again. If the problem persists, contact support.
                                    </p>
                                </div>

                                <Button
                                    onClick={() => router.back()}
                                    className="w-full h-12 bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Try Again
                                </Button>

                                <Button
                                    onClick={() => router.push("/help")}
                                    variant="outline"
                                    className="w-full h-12"
                                >
                                    Contact Support
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
