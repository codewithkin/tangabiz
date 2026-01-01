"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

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
                    <Card className="shadow-lg border-0">
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-3xl font-bold">
                                <span className="text-yellow-400">Tanga</span>
                                <span className="text-green-600">biz</span>
                            </CardTitle>
                            <CardDescription>
                                Smart POS for Smart Business
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Email Field */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-semibold text-foreground"
                                    >
                                        Email*
                                    </label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Your email address"
                                        className="h-12"
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    disabled={isLoading || !email}
                                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        "Continue with Email"
                                    )}
                                </Button>
                            </form>
                        </CardContent>

                        <CardFooter className="flex-col gap-4 pt-0">
                            <div className="w-full border-t border-t-gray-300 pt-4">
                                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                                    By signing up, you agree to our{" "}
                                    <a href="/terms-of-service" className="text-green-600 hover:underline font-medium">
                                        Terms of Service
                                    </a>{" "}
                                    and{" "}
                                    <a href="/privacy-policy" className="text-green-600 hover:underline font-medium">
                                        Privacy Policy
                                    </a>
                                </p>
                            </div>
                        </CardFooter>
                    </Card>
                ) : (
                    /* Success State */
                    <Card className="shadow-lg border-0 text-center">
                        <CardHeader>
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <Mail className="h-8 w-8 text-green-600" />
                            </div>
                            <CardTitle className="text-2xl">Check your email</CardTitle>
                            <CardDescription className="space-y-2">
                                <span className="block">We sent a magic link to</span>
                                <span className="block font-semibold text-foreground break-all">
                                    {email}
                                </span>
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200/50">
                                <p className="text-sm text-yellow-800">
                                    ✨ Click the link in the email to sign in. The link expires in 5 minutes.
                                </p>
                            </div>
                        </CardContent>

                        <CardFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setIsSent(false);
                                    setEmail("");
                                }}
                                className="w-full text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                                ← Use a different email
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            </div>
        </div>
    );
}