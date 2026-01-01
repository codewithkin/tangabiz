"use client";

import { Building2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSessionRedirect } from "@/lib/use-session-redirect";

export default function OnboardingPage() {
    const router = useRouter();
    // Protect this page - only authenticated users can access
    useSessionRedirect(true);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
            <div className="w-full max-w-2xl space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-green-600">Tangabiz</h1>
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
                    <button
                        type="button"
                        onClick={() => router.push("/onboarding/business")}
                        className="group p-8 rounded-2xl border-2 border-border hover:border-green-600 bg-background hover:bg-green-50 transition-all text-left space-y-4"
                    >
                        <div className="w-14 h-14 rounded-xl bg-green-100 group-hover:bg-green-200 flex items-center justify-center transition-colors">
                            <Building2 className="w-7 h-7 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-foreground">
                                Business Owner
                            </h3>
                            <p className="text-muted-foreground mt-1">
                                I want to set up my shop and start using Tangabiz POS
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-green-600 font-medium">
                            <span>Create my shop</span>
                            <span>→</span>
                        </div>
                    </button>

                    {/* Staff Member */}
                    <button
                        type="button"
                        onClick={() => router.push("/onboarding/join")}
                        className="group p-8 rounded-2xl border-2 border-border hover:border-yellow-500 bg-background hover:bg-yellow-50 transition-all text-left space-y-4"
                    >
                        <div className="w-14 h-14 rounded-xl bg-yellow-100 group-hover:bg-yellow-200 flex items-center justify-center transition-colors">
                            <Users className="w-7 h-7 text-yellow-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-foreground">
                                Staff Member
                            </h3>
                            <p className="text-muted-foreground mt-1">
                                I was invited to join an existing shop as staff
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-yellow-600 font-medium">
                            <span>Join a shop</span>
                            <span>→</span>
                        </div>
                    </button>
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
