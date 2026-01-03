"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";

export default function DashboardLoading() {
    const [orgData, setOrgData] = React.useState<{ logo: string | null; name: string } | null>(null);
    const { data: session } = authClient.useSession();

    React.useEffect(() => {
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
            } catch (error) {
                console.error("Error fetching org data:", error);
            }
        };

        fetchOrgData();
    }, [session?.session?.activeOrganizationId]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
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
            <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-4" />
            <p className="text-muted-foreground">Loading...</p>
        </div>
    );
}
