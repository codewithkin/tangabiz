"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const [orgData, setOrgData] = React.useState<{ logo: string | null; name: string } | null>(null);
    const { data: session } = authClient.useSession();

    React.useEffect(() => {
        console.error("Dashboard error:", error);

        const fetchOrgData = async () => {
            if (!session?.session?.activeOrganizationId) return;

            try {
                const response = await fetch(`/api/organizations/${session.session.activeOrganizationId}`);
                if (response.ok) {
                    const data = await response.json();
                    setOrgData({
                        logo: data.logo || null,
                        name: data.name || "Your Shop",
                    });
                }
            } catch (err) {
                console.error("Error fetching org data:", err);
            }
        };

        fetchOrgData();
    }, [error, session?.session?.activeOrganizationId]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            {orgData?.logo ? (
                <div className="mb-6 w-20 h-20 rounded-full overflow-hidden">
                    <Image
                        src={orgData.logo}
                        alt={orgData.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                    />
                </div>
            ) : (
                <div className="mb-6 w-20 h-20 rounded-full bg-green-600 flex items-center justify-center text-white text-3xl font-bold">
                    {orgData?.name?.charAt(0)?.toUpperCase() || "T"}
                </div>
            )}
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Something went wrong!</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
                {error.message || "An unexpected error occurred. Please try again."}
            </p>
            <Button onClick={reset} className="bg-green-600 hover:bg-green-700">
                Try again
            </Button>
        </div>
    );
}
