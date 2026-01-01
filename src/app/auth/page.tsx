"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Mail, Loader2 } from "lucide-react";

export default function AuthPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const { error } = await authClient.signIn.magicLink({
                email,
                callbackURL: "/dashboard",
                newUserCallbackURL: "/onboarding",
            });

            if (error) {
                setError(error.message || "Something went wrong. Please try again.");
            } else {
                setIsSent(true);
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Decorative Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-600/10 rounded-full blur-3xl" />
            </div>

            {/* Main Card */}
            <div className="w-full max-w-md relative z-10">
                {!isSent ? (
                    <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
                        {/* Header */}
                        <div className="text-center space-y-2">
                            <h1 className="text-3xl font-bold text-green-600">Tangabiz</h1>
                            <p className="text-sm text-gray-600">Smart POS for Smart Business</p>
                        </div>

                        {/* Login Heading */}
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900">Login</h2>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-semibold text-gray-900"
                                >
                                    Email*
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-green-600 focus:ring-2 focus:ring-green-600/20 transition-all"
                                    placeholder="Your email address"
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading || !email}
                                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Sending...
                                    </span>
                                ) : (
                                    "Login"
                                )}
                            </button>
                        </form>

                        {/* Forgot Password / Sign Up Links */}
                        <div className="flex items-center justify-between pt-2">
                            <a
                                href="#"
                                className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                            >
                                Forgot your password?
                            </a>
                            <a
                                href="#"
                                className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                            >
                                Sign Up
                            </a>
                        </div>

                        {/* Terms Message */}
                        <div className="pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-600 text-center leading-relaxed">
                                By signing up, you agree to our{" "}
                                <a href="/terms" className="text-green-600 hover:underline font-medium">
                                    Terms of Service
                                </a>{" "}
                                and{" "}
                                <a href="/privacy" className="text-green-600 hover:underline font-medium">
                                    Privacy Policy
                                </a>
                            </p>
                        </div>

                        {/* Info */}
                        <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200/50">
                            <p className="text-xs text-yellow-800 text-center">
                                🔐 No password needed. We'll send you a magic link via email.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Success State */
                    <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8 text-center">
                        <div className="space-y-4">
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <Mail className="h-8 w-8 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Check your email
                            </h2>
                            <p className="text-gray-600">
                                We sent a magic link to
                            </p>
                            <p className="font-semibold text-gray-900 break-all">{email}</p>
                        </div>

                        <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200/50">
                            <p className="text-sm text-yellow-800">
                                ✨ Click the link in the email to sign in. The link expires in 5 minutes.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setIsSent(false);
                                setEmail("");
                            }}
                            className="w-full py-2 px-4 text-green-600 hover:text-green-700 hover:bg-green-50 font-medium rounded-lg transition-colors"
                        >
                            ← Use a different email
                        </button>
                    </div>
                )}            </div>
        </div>
    );
}