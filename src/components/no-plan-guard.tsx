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
            console.log("[NoPlanGuard] Starting org plan fetch", { orgId: org?.id, pathname });

            if (!org?.id) {
                console.log("[NoPlanGuard] No org ID found, skipping fetch");
                setIsLoadingPlan(false);
                return;
            }

            try {
                console.log("[NoPlanGuard] Fetching org data for:", org.id);
                // Add cache-busting to ensure fresh data after payment
                const response = await fetch(`/api/organizations/${org.id}?t=${Date.now()}`, {
                    cache: 'no-store'
                });
                console.log("[NoPlanGuard] Fetch response status:", response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log("[NoPlanGuard] Org data received:", { plan: data.plan, planStartedAt: data.planStartedAt, orgId: data.id });
                    setOrgPlanData({
                        plan: data.plan,
                        planStartedAt: data.planStartedAt,
                    });
                } else {
                    console.error("[NoPlanGuard] Failed to fetch org data:", response.status);
                }
            } catch (error) {
                console.error("[NoPlanGuard] Error fetching org plan data:", error);
            } finally {
                setIsLoadingPlan(false);
            }
        };

        fetchOrgPlan();
    }, [org?.id, pathname]); // Re-fetch when pathname changes (e.g., coming from /payments)

    React.useEffect(() => {
        console.log("[NoPlanGuard] Plan check effect triggered", { isPending, hasSession: !!session, hasOrg: !!org, pathname, orgPlanData });

        if (isPending) {
            console.log("[NoPlanGuard] Still pending, skipping check");
            return;
        }

        // If no session, auth middleware will handle redirect
        if (!session) {
            console.log("[NoPlanGuard] No session found");
            return;
        }

        // If no org, user needs to complete onboarding
        if (!org) {
            console.log("[NoPlanGuard] No org found, redirecting to onboarding");
            router.push("/onboarding");
            return;
        }

        // Check if current path is exempt
        const isExempt = EXEMPT_PATHS.some((path) => pathname.startsWith(path));
        console.log("[NoPlanGuard] Path exempt check:", { pathname, isExempt, exemptPaths: EXEMPT_PATHS });
        if (isExempt) {
            console.log("[NoPlanGuard] Path is exempt, allowing access");
            return;
        }

        // Check plan from database
        const plan = orgPlanData?.plan;
        const planStartedAt = orgPlanData?.planStartedAt;
        console.log("[NoPlanGuard] Checking plan:", { plan, planStartedAt, orgId: org.id });

        // If no plan, redirect to billing to select a plan
        if (!plan) {
            console.error("[NoPlanGuard] NO PLAN FOUND - Redirecting to billing", { orgId: org.id, orgPlanData });
            router.push("/dashboard/billing");
            return;
        }

        console.log("[NoPlanGuard] Plan check passed:", plan);

        // If plan exists, check if trial is active (for trial users)
        if (planStartedAt && !isTrialActive(planStartedAt ? new Date(planStartedAt) : null)) {
            console.log("[NoPlanGuard] Trial expired, redirecting to billing");
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
