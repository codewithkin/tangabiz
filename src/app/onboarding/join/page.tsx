"use client";

import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSessionRedirect } from "@/lib/use-session-redirect";

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
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-green-600">Tangabiz</h1>
                    <h2 className="text-3xl font-semibold text-foreground">
                        Join a shop
                    </h2>
                    <p className="text-muted-foreground">
                        Enter the invite code provided by your manager
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label
                            htmlFor="inviteCode"
                            className="block text-sm font-medium text-foreground"
                        >
                            Invite code
                        </label>
                        <input
                            id="inviteCode"
                            name="inviteCode"
                            type="text"
                            required
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                            className="block w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all font-mono text-center text-lg tracking-widest"
                            placeholder="XXXX-XXXX"
                            maxLength={9}
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !inviteCode}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Joining...
                            </>
                        ) : (
                            "Join Shop"
                        )}
                    </button>
                </form>

                {/* Help */}
                <p className="text-center text-sm text-muted-foreground">
                    Don&apos;t have an invite code? Ask your manager or shop owner to send
                    you one.
                </p>
            </div>
        </div>
    );
}
