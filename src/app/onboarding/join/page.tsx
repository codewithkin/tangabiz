"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Mail, CheckCircle, XCircle, Building2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useSessionRedirect } from "@/lib/use-session-redirect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Invitation {
    id: string;
    email: string;
    role: string;
    status: string;
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
    inviterEmail: string;
    expiresAt: Date;
}

export default function JoinOnboardingPage() {
    const router = useRouter();
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [acceptingId, setAcceptingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Protect this page - only authenticated users can access
    useSessionRedirect(true);

    const { data: session } = authClient.useSession();

    useEffect(() => {
        const fetchInvitations = async () => {
            if (!session?.user?.email) return;

            try {
                // Fetch pending invitations for the current user
                const response = await fetch("/api/team/invitations");
                if (!response.ok) {
                    throw new Error("Failed to fetch invitations");
                }
                const data = await response.json();
                setInvitations(data.invitations || []);
            } catch (err) {
                setError("Failed to load invitations");
                console.error("Error fetching invitations:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInvitations();
    }, [session?.user?.email]);

    const handleAcceptInvitation = async (invitationId: string) => {
        setAcceptingId(invitationId);
        setError(null);

        try {
            // Accept the invitation using better-auth
            const { error: acceptError } = await authClient.organization.acceptInvitation({
                invitationId,
            });

            if (acceptError) {
                setError(acceptError.message || "Failed to accept invitation");
                setAcceptingId(null);
                return;
            }

            // Find the invitation to get the organization ID
            const invitation = invitations.find(inv => inv.id === invitationId);
            if (invitation) {
                // Set the organization as active
                await authClient.organization.setActive({
                    organizationId: invitation.organizationId,
                });
            }

            // Redirect to dashboard
            router.push("/dashboard");
        } catch (err) {
            setError("An unexpected error occurred");
            setAcceptingId(null);
        }
    };

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case "owner":
                return "default";
            case "admin":
                return "secondary";
            default:
                return "outline";
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
            <div className="w-full max-w-2xl space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold">
                        <span className="text-yellow-400">Tanga</span>
                        <span className="text-green-600">biz</span>
                    </h1>
                    <h2 className="text-3xl font-semibold text-foreground">
                        Join a Shop
                    </h2>
                    <p className="text-muted-foreground">
                        Accept an invitation to join an existing shop
                    </p>
                </div>

                {/* Back button */}
                <Button
                    variant="ghost"
                    onClick={() => router.push("/onboarding")}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to options
                </Button>

                {/* Content */}
                <Card className="border-2">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                                <Mail className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <CardTitle>Pending Invitations</CardTitle>
                                <CardDescription>
                                    Invitations sent to {session?.user?.email}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : error && invitations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <XCircle className="w-12 h-12 text-red-500 mb-4" />
                                <p className="text-red-500 font-medium">{error}</p>
                            </div>
                        ) : invitations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground font-medium">No pending invitations</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Ask your shop owner to send you an invitation
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {error && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}
                                {invitations.map((invitation) => (
                                    <div
                                        key={invitation.id}
                                        className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{invitation.organizationName}</span>
                                                <Badge variant={getRoleBadgeVariant(invitation.role)}>
                                                    {invitation.role}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Invited by {invitation.inviterEmail}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => handleAcceptInvitation(invitation.id)}
                                            disabled={acceptingId !== null}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            {acceptingId === invitation.id ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                    Accepting...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Accept
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Direct link info */}
                <Card className="border-dashed">
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground text-center">
                            If you received an invitation link via email, clicking it will take you directly to accept the invitation.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
