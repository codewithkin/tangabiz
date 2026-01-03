"use client";

import * as React from "react";
import { authClient } from "@/lib/auth-client";
import { UpgradeOverlay } from "@/components/upgrade-overlay";
import { Loader2 } from "lucide-react";

export default function EmailMarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [plan, setPlan] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchPlan = async () => {
            try {
                const session = await authClient.getSession();
                const orgId = session?.data?.session?.activeOrganizationId;

                if (orgId) {
                    const res = await fetch(`/api/organizations/${orgId}`);
                    const data = await res.json();
                    setPlan(data.plan || "starter");
                }
            } catch (error) {
                console.error("Failed to fetch plan:", error);
                setPlan("starter");
            } finally {
                setLoading(false);
            }
        };

        fetchPlan();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    const hasAccess = plan === "growth" || plan === "business" || plan === "enterprise";

    return (
        <div className="relative min-h-[600px]">
            {children}
            {!hasAccess && (
                <UpgradeOverlay
                    feature="Email Marketing"
                    description="Send beautiful email campaigns to all your customers and grow your business with targeted marketing."
                    requiredPlans={["Growth", "Business"]}
                />
            )}
        </div>
    );
}
