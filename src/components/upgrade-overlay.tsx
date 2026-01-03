"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, ArrowRight } from "lucide-react";

interface UpgradeOverlayProps {
    feature: string;
    description?: string;
    requiredPlans?: string[];
}

export function UpgradeOverlay({
    feature,
    description = "Upgrade your plan to unlock this feature and grow your business.",
    requiredPlans = ["Growth", "Business"],
}: UpgradeOverlayProps) {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="max-w-md text-center p-8 bg-white rounded-2xl shadow-2xl border">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mb-6">
                    <Lock className="h-8 w-8 text-amber-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Unlock {feature}
                </h2>

                <p className="text-muted-foreground mb-6">{description}</p>

                <div className="flex items-center justify-center gap-2 mb-6">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-gray-600">
                        Available on {requiredPlans.join(" and ")} plans
                    </span>
                </div>

                <Link href="/dashboard/billing">
                    <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8">
                        Upgrade Now
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </Link>

                <p className="text-xs text-muted-foreground mt-4">
                    Start your 14-day free trial today
                </p>
            </div>
        </div>
    );
}
