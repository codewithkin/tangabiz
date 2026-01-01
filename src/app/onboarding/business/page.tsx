"use client";

import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSessionRedirect } from "@/lib/use-session-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BusinessOnboardingPage() {
    const router = useRouter();
    // Protect this page - only authenticated users can access
    useSessionRedirect(true);
    const [shopName, setShopName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // TODO: Create organization via better-auth organization plugin
        // For now, just redirect to dashboard
        setTimeout(() => {
            router.push("/dashboard");
        }, 1000);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
            <div className="w-full max-w-md space-y-8">
                {/* Back button */}
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>

                <Card>
                    <CardHeader>
                        <div className="text-2xl font-bold">
                            <span className="text-yellow-400">Tanga</span>
                            <span className="text-green-600">biz</span>
                        </div>
                        <CardTitle className="text-3xl">Create your shop</CardTitle>
                        <CardDescription>
                            Set up your business to start using Tangabiz POS
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label
                                    htmlFor="shopName"
                                    className="block text-sm font-medium text-foreground"
                                >
                                    Shop name
                                </label>
                                <Input
                                    id="shopName"
                                    name="shopName"
                                    type="text"
                                    required
                                    value={shopName}
                                    onChange={(e) => setShopName(e.target.value)}
                                    placeholder="My Awesome Shop"
                                    className="h-12"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading || !shopName}
                                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Creating shop...
                                    </>
                                ) : (
                                    "Create Shop & Start Free Trial"
                                )}
                            </Button>
                        </form>

                        {/* Trial info */}
                        <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                            <p className="text-sm text-yellow-800">
                                🎉 Start with a <strong>3-day free trial</strong> with full access
                                to Pro features. No payment required.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
