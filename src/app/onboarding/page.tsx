"use client";

import { Building2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSessionRedirect } from "@/lib/use-session-redirect";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnboardingPage() {
    const router = useRouter();
    // Protect this page - only authenticated users can access
    useSessionRedirect(true);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
            <div className="w-full max-w-2xl space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold">
                        <span className="text-yellow-400">Tanga</span>
                        <span className="text-green-600">biz</span>
                    </h1>
                    <h2 className="text-3xl font-semibold text-foreground">
                        What are you here for?
                    </h2>
                    <p className="text-muted-foreground">
                        Let us know how you&apos;ll be using Tangabiz
                    </p>
                </div>

                {/* Options */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Business Owner */}
                    <Card
                        className="cursor-pointer group border-2 hover:border-green-600 hover:bg-green-50 transition-all"
                        onClick={() => router.push("/onboarding/business")}
                    >
                        <CardHeader>
                            <div className="w-14 h-14 rounded-xl bg-green-100 group-hover:bg-green-200 flex items-center justify-center transition-colors">
                                <Building2 className="w-7 h-7 text-green-600" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <CardTitle className="text-xl">Business Owner</CardTitle>
                                <CardDescription className="mt-1">
                                    I want to set up my shop and start using Tangabiz POS
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2 text-green-600 font-medium">
                                <span>Create my shop</span>
                                <span>→</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Staff Member */}
                    <Card
                        className="cursor-pointer group border-2 hover:border-yellow-500 hover:bg-yellow-50 transition-all"
                        onClick={() => router.push("/onboarding/join")}
                    >
                        <CardHeader>
                            <div className="w-14 h-14 rounded-xl bg-yellow-100 group-hover:bg-yellow-200 flex items-center justify-center transition-colors">
                                <Users className="w-7 h-7 text-yellow-600" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <CardTitle className="text-xl">Staff Member</CardTitle>
                                <CardDescription className="mt-1">
                                    I was invited to join an existing shop as staff
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2 text-yellow-600 font-medium">
                                <span>Join a shop</span>
                                <span>→</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Help */}
                <p className="text-center text-sm text-muted-foreground">
                    Not sure?{" "}
                    <a href="/help" className="text-green-600 hover:underline">
                        Contact support
                    </a>
                </p>
            </div>
        </div>
    );
}
