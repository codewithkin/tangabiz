"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useActiveOrganization, useSession } from "@/lib/auth-client";
import { isTrialActive, TRIAL_DURATION_DAYS } from "@/lib/plans";
import { Loader2 } from "lucide-react";

// Pages that don't require a plan
const EXEMPT_PATHS = [
    "/dashboard/select-plan",
    "/dashboard/billing/success",
    "/dashboard/billing",
    "/dashboard/settings",
];

export function NoPlanGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, isPending: sessionPending } = useSession();
    const { data: org, isPending: orgPending } = useActiveOrganization();

    const isPending = sessionPending || orgPending;

    React.useEffect(() => {
        if (isPending) return;

        // If no session, auth middleware will handle redirect
        if (!session) return;

        // If no org, user needs to complete onboarding
        if (!org) {
            router.push("/onboarding");
            return;
        }

        // Check if current path is exempt
        const isExempt = EXEMPT_PATHS.some((path) => pathname.startsWith(path));
        if (isExempt) return;

        // Get org plan info (cast to any to access custom fields)
        const orgData = org as any;
        const plan = orgData.plan as string | null;
        const planStartedAt = orgData.planStartedAt as string | null;

        // If no plan and no trial, redirect to plan selection
        if (!plan) {
            router.push("/dashboard/select-plan");
            return;
        }

        // If plan exists, check if trial is active (for trial users)
        if (planStartedAt && !isTrialActive(planStartedAt)) {
            // Trial expired, redirect to billing to upgrade
            router.push("/dashboard/billing?expired=true");
            return;
        }
    }, [isPending, session, org, pathname, router]);

    // Show loading while checking
    if (isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // If no org, show nothing (will redirect)
    if (!org) {
        return null;
    }

    // Check if path is exempt
    const isExempt = EXEMPT_PATHS.some((path) => pathname.startsWith(path));
    if (isExempt) {
        return <>{children}</>;
    }

    // Check plan status
    const orgData = org as any;
    const plan = orgData.plan as string | null;
    const planStartedAt = orgData.planStartedAt as string | null;

    // If no plan, don't render (will redirect)
    if (!plan) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
                    <p className="text-muted-foreground">Redirecting to plan selection...</p>
                </div>
            </div>
        );
    }

    // If trial expired, don't render (will redirect)
    if (planStartedAt && !isTrialActive(planStartedAt)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
                    <p className="text-muted-foreground">Redirecting to billing...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
