"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useActiveOrganization, useSession } from "@/lib/auth-client";
import { isTrialActive, TRIAL_DURATION_DAYS } from "@/lib/plans";
import { Loader2 } from "lucide-react";

// Pages that don't require a plan
const EXEMPT_PATHS = [
    "/payments",
    "/dashboard/billing/success",
    "/dashboard/billing",
    "/dashboard/settings",
    "/onboarding",
];

interface OrgPlanData {
    plan: string | null;
    planStartedAt: string | null;
}

export function NoPlanGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, isPending: sessionPending } = useSession();
    const { data: org, isPending: orgPending } = useActiveOrganization();

    const [orgPlanData, setOrgPlanData] = React.useState<OrgPlanData | null>(null);
    const [isLoadingPlan, setIsLoadingPlan] = React.useState(true);

    const isPending = sessionPending || orgPending || isLoadingPlan;

    // Fetch full organization data from database (including plan fields)
    React.useEffect(() => {
        const fetchOrgPlan = async () => {
            if (!org?.id) {
                setIsLoadingPlan(false);
                return;
            }

            try {
                // Add cache-busting to ensure fresh data after payment
                const response = await fetch(`/api/organizations/${org.id}?t=${Date.now()}`, {
                    cache: 'no-store'
                });
                if (response.ok) {
                    const data = await response.json();
                    setOrgPlanData({
                        plan: data.plan,
                        planStartedAt: data.planStartedAt,
                    });
                }
            } catch (error) {
                console.error("Error fetching org plan data:", error);
            } finally {
                setIsLoadingPlan(false);
            }
        };

        fetchOrgPlan();
    }, [org?.id, pathname]); // Re-fetch when pathname changes (e.g., coming from /payments)

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

        // Check plan from database
        const plan = orgPlanData?.plan;
        const planStartedAt = orgPlanData?.planStartedAt;

        // If no plan, redirect to billing to select a plan
        if (!plan) {
            router.push("/dashboard/billing");
            return;
        }

        // If plan exists, check if trial is active (for trial users)
        if (planStartedAt && !isTrialActive(planStartedAt ? new Date(planStartedAt) : null)) {
            // Trial expired, redirect to billing to upgrade
            router.push("/dashboard/billing?expired=true");
            return;
        }
    }, [isPending, session, org, orgPlanData, pathname, router]);

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
    const plan = orgPlanData?.plan;
    const planStartedAt = orgPlanData?.planStartedAt;

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
    if (planStartedAt && !isTrialActive(planStartedAt ? new Date(planStartedAt) : null)) {
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
