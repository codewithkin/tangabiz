"use client";

import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSessionRedirect } from "@/lib/use-session-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function JoinOnboardingPage() {
    const router = useRouter();
    // Protect this page - only authenticated users can access
    useSessionRedirect(true);
    const [inviteCode, setInviteCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        // TODO: Join organization via better-auth organization plugin
        // For now, just show error or redirect
        setTimeout(() => {
            setError("Invalid invite code. Please check and try again.");
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
            <div className="w-full max-w-md space-y-8">
                {/* Back button */}
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>

                <Card>
                    <CardHeader>
                        <div className="text-2xl font-bold">
                            <span className="text-yellow-400">Tanga</span>
                            <span className="text-green-600">biz</span>
                        </div>
                        <CardTitle className="text-3xl">Join a shop</CardTitle>
                        <CardDescription>
                            Enter the invite code provided by your manager
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label
                                    htmlFor="inviteCode"
                                    className="block text-sm font-medium text-foreground"
                                >
                                    Invite code
                                </label>
                                <Input
                                    id="inviteCode"
                                    name="inviteCode"
                                    type="text"
                                    required
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                    placeholder="XXXX-XXXX"
                                    maxLength={9}
                                    className="h-12 font-mono text-center text-lg tracking-widest"
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={isLoading || !inviteCode}
                                className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-white"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Joining...
                                    </>
                                ) : (
                                    "Join Shop"
                                )}
                            </Button>
                        </form>

                        {/* Help */}
                        <p className="text-center text-sm text-muted-foreground">
                            Don&apos;t have an invite code? Ask your manager or shop owner to send
                            you one.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
