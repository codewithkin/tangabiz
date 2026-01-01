"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AcceptInvitationPage() {
    const params = useParams();
    const router = useRouter();
    const invitationId = params.id as string;

    const [status, setStatus] = useState<"loading" | "success" | "error" | "needsAuth">("loading");
    const [error, setError] = useState("");
    const [organizationId, setOrganizationId] = useState<string | null>(null);

    const { data: session, isPending } = authClient.useSession();

    useEffect(() => {
        const acceptInvitation = async () => {
            if (isPending) return;

            if (!session) {
                setStatus("needsAuth");
                return;
            }

            try {
                // Get invitation details first
                const { data: invitation, error: getError } = await authClient.organization.getInvitation({
                    query: { id: invitationId },
                });

                if (getError || !invitation) {
                    setError("Invitation not found or has expired");
                    setStatus("error");
                    return;
                }

                // Accept the invitation
                const { error: acceptError } = await authClient.organization.acceptInvitation({
                    invitationId,
                });

                if (acceptError) {
                    setError(acceptError.message || "Failed to accept invitation");
                    setStatus("error");
                    return;
                }

                setStatus("success");
                setOrganizationId(invitation.organizationId);

                // Set the organization as active and redirect
                if (invitation.organizationId) {
                    await authClient.organization.setActive({
                        organizationId: invitation.organizationId,
                    });
                }

                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    router.push("/dashboard");
                }, 2000);
            } catch (err) {
                setError("An unexpected error occurred");
                setStatus("error");
            }
        };

        acceptInvitation();
    }, [invitationId, session, isPending, router]);

    const handleSignIn = () => {
        // Store the invitation ID and redirect to auth
        sessionStorage.setItem("pendingInvitation", invitationId);
        router.push("/auth");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8">
            {/* Decorative elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 -left-40 w-80 h-80 bg-green-600/10 rounded-full blur-3xl" />
            </div>

            <Card className="relative w-full max-w-md border-0 shadow-lg">
                <CardHeader className="text-center">
                    <div className="text-base font-bold mx-auto mb-4">
                        <span className="text-yellow-400">Tanga</span>
                        <span className="text-green-600">biz</span>
                    </div>
                    <CardTitle className="text-2xl">Accept Invitation</CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                    {(status === "loading" || isPending) && (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                            <p className="text-muted-foreground">Processing invitation...</p>
                        </div>
                    )}

                    {status === "needsAuth" && (
                        <div className="flex flex-col items-center gap-4 py-4">
                            <CardDescription className="text-center">
                                Please sign in to accept your invitation and join the team.
                            </CardDescription>
                            <Button
                                onClick={handleSignIn}
                                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
                            >
                                Sign in to continue
                            </Button>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <CheckCircle className="h-12 w-12 text-green-600" />
                            <div className="text-center">
                                <p className="font-semibold text-lg">Welcome aboard!</p>
                                <p className="text-muted-foreground">
                                    You've successfully joined the team.
                                </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Redirecting to dashboard...
                            </p>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <XCircle className="h-12 w-12 text-red-500" />
                            <div className="text-center">
                                <p className="font-semibold text-lg">Unable to accept invitation</p>
                                <p className="text-muted-foreground">{error}</p>
                            </div>
                            <Button
                                onClick={() => router.push("/dashboard")}
                                variant="outline"
                                className="mt-4"
                            >
                                Go to Dashboard
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
