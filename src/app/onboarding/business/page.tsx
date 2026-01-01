"use client";

import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSessionRedirect } from "@/lib/use-session-redirect";

export default function BusinessOnboardingPage() {
    const router = useRouter();
    // Protect this page - only authenticated users can access
    useSessionRedirect(true);
    const [shopName, setShopName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // TODO: Create organization via better-auth organization plugin
        // For now, just redirect to dashboard
        setTimeout(() => {
            router.push("/dashboard");
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
                        Create your shop
                    </h2>
                    <p className="text-muted-foreground">
                        Set up your business to start using Tangabiz POS
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label
                            htmlFor="shopName"
                            className="block text-sm font-medium text-foreground"
                        >
                            Shop name
                        </label>
                        <input
                            id="shopName"
                            name="shopName"
                            type="text"
                            required
                            value={shopName}
                            onChange={(e) => setShopName(e.target.value)}
                            className="block w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                            placeholder="My Awesome Shop"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !shopName}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Creating shop...
                            </>
                        ) : (
                            "Create Shop & Start Free Trial"
                        )}
                    </button>
                </form>

                {/* Trial info */}
                <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                        🎉 Start with a <strong>3-day free trial</strong> with full access
                        to Pro features. No payment required.
                    </p>
                </div>
            </div>
        </div>
    );
}
