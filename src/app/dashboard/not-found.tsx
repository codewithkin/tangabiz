"use client";

import * as React from "react";
import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";

export default function DashboardNotFound() {
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
            <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-4xl font-bold mb-2">404</h1>
            <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
                The page you're looking for doesn't exist or has been moved.
            </p>
            <Link href="/dashboard">
                <Button className="bg-green-600 hover:bg-green-700">
                    Back to Dashboard
                </Button>
            </Link>
        </div>
    );
}
