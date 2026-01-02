"use client";

import { Suspense, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Plus, Trash2, UserPlus, Check, Sparkles, Zap, Crown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSessionRedirect } from "@/lib/use-session-redirect";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getAllPlans, getPlan, formatLimit, TRIAL_DURATION_DAYS } from "@/lib/plans";

const TOTAL_STEPS = 3;

interface Invite {
    email: string;
    role: "admin" | "member";
}

function ProgressIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                <div
                    key={step}
                    className={`h-2 w-12 rounded-full transition-colors ${step <= currentStep ? "bg-green-500" : "bg-gray-300"}`}
                />
            ))}
        </div>
    );
}

function BusinessOnboardingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    useSessionRedirect(true);

    const [currentStep, setCurrentStep] = useState(() => {
        const stepParam = searchParams.get("step");
        if (stepParam) {
            const step = parseInt(stepParam, 10);
            if (step >= 1 && step <= TOTAL_STEPS) return step;
        }
        return 1;
    });

    const [shopName, setShopName] = useState("");
    const [organizationId, setOrganizationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [invites, setInvites] = useState<Invite[]>([{ email: "", role: "member" }]);
    const [inviteErrors, setInviteErrors] = useState<string[]>([]);
    const [inviteSuccess, setInviteSuccess] = useState<boolean[]>([]);

    const plans = getAllPlans();

    const PLAN_ICONS = { starter: Sparkles, growth: Zap, enterprise: Crown };
    const PLAN_COLORS = {
        starter: "border-blue-200 hover:border-blue-400 hover:bg-blue-50/50",
        growth: "border-green-200 hover:border-green-400 hover:bg-green-50/50",
        enterprise: "border-purple-200 hover:border-purple-400 hover:bg-purple-50/50",
    };

    const handleCreateShop = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const slug = shopName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
            const { data, error: createError } = await authClient.organization.create({ name: shopName, slug });

            if (createError) {
                setError(createError.message || "Failed to create shop");
                setIsLoading(false);
                return;
            }

            if (data?.id) {
                await authClient.organization.setActive({ organizationId: data.id });
                setOrganizationId(data.id);
                setCurrentStep(2);
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const addInvite = () => {
        setInvites([...invites, { email: "", role: "member" }]);
        setInviteErrors([...inviteErrors, ""]);
        setInviteSuccess([...inviteSuccess, false]);
    };

    const removeInvite = (index: number) => {
        setInvites(invites.filter((_, i) => i !== index));
        setInviteErrors(inviteErrors.filter((_, i) => i !== index));
        setInviteSuccess(inviteSuccess.filter((_, i) => i !== index));
    };

    const updateInvite = (index: number, field: keyof Invite, value: string) => {
        const updated = [...invites];
        updated[index] = { ...updated[index], [field]: value };
        setInvites(updated);
        const errors = [...inviteErrors];
        errors[index] = "";
        setInviteErrors(errors);
    };

    const sendInvite = async (index: number) => {
        const invite = invites[index];
        if (!invite.email || !invite.email.includes("@")) {
            const errors = [...inviteErrors];
            errors[index] = "Please enter a valid email";
            setInviteErrors(errors);
            return;
        }

        setIsLoading(true);
        const errors = [...inviteErrors];
        const success = [...inviteSuccess];

        try {
            await fetch("/api/users/ensure", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: invite.email }),
            });

            const { error: inviteError } = await authClient.organization.inviteMember({
                email: invite.email,
                role: invite.role,
                organizationId: organizationId!,
            });

            if (inviteError) {
                errors[index] = inviteError.message || "Failed to send invitation";
            } else {
                success[index] = true;
            }
        } catch (err) {
            errors[index] = "Failed to send invitation";
        } finally {
            setInviteErrors(errors);
            setInviteSuccess(success);
            setIsLoading(false);
        }
    };

    const sendAllInvites = async () => {
        const validInvites = invites.filter(inv => inv.email && inv.email.includes("@"));
        if (validInvites.length === 0) {
            router.push("/dashboard");
            return;
        }

        setIsLoading(true);
        for (let i = 0; i < invites.length; i++) {
            if (invites[i].email && !inviteSuccess[i]) {
                await sendInvite(i);
            }
        }
        setIsLoading(false);
        router.push("/dashboard");
    };

    const handleSelectPlan = async (planId: string) => {
        setSelectedPlan(planId);
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/billing/select-plan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planId }),
            });

            if (!res.ok) {
                setError("Failed to select plan. Please try again.");
                setIsLoading(false);
                return;
            }

            console.log("Selected plan saved, initiating Polar checkout for:", planId);

            // Initiate Polar checkout using Better Auth plugin with explicit product ID
            try {
                const planObj = getPlan(planId);
                const productId = planObj?.polarProductId;

                if (!productId) {
                    setError("No product configured for this plan. Contact support.");
                    setIsLoading(false);
                    return;
                }

                const checkoutResult = await authClient.checkout({
                    products: [productId],
                });

                console.log("Checkout result:", checkoutResult);

                if (checkoutResult?.error) {
                    console.error("Checkout error:", checkoutResult.error);
                    setError(checkoutResult.error.message || "Failed to initiate checkout.");
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("Checkout exception:", err);
                setError(`Failed to initiate checkout: ${err instanceof Error ? err.message : "Unknown error"}`);
                setIsLoading(false);
            }
        } catch (e) {
            console.error("Checkout exception:", e);
            setError(`Failed to initiate checkout: ${e instanceof Error ? e.message : "Unknown error"}`);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 -left-40 w-80 h-80 bg-green-600/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md space-y-6">
                <div className="text-center text-sm text-muted-foreground mb-2">Step {currentStep} of {TOTAL_STEPS}</div>
                <ProgressIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

                {currentStep > 1 && (
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                )}

                <Card className="border-0 shadow-lg">
                    <CardHeader className="text-center">
                        <div className="text-base font-bold mx-auto">
                            <span className="text-yellow-400">Tanga</span>
                            <span className="text-green-600">biz</span>
                        </div>

                        {currentStep === 1 && (
                            <>
                                <CardTitle className="text-2xl">Create your shop</CardTitle>
                                <CardDescription>Set up your business to start using Tangabiz POS</CardDescription>
                            </>
                        )}
                        {currentStep === 2 && (
                            <>
                                <CardTitle className="text-2xl">Choose your plan</CardTitle>
                                <CardDescription>Start with a {TRIAL_DURATION_DAYS}-day free trial on any plan</CardDescription>
                            </>
                        )}
                        {currentStep === 3 && (
                            <>
                                <CardTitle className="text-2xl">Invite your team</CardTitle>
                                <CardDescription>Add team members to help manage {shopName}</CardDescription>
                            </>
                        )}
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {currentStep === 1 && (
                            <form onSubmit={handleCreateShop} className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="shopName" className="block text-sm font-medium text-foreground">
                                        Shop name
                                    </label>
                                    <Input
                                        id="shopName"
                                        type="text"
                                        required
                                        value={shopName}
                                        onChange={(e) => setShopName(e.target.value)}
                                        placeholder="My Awesome Shop"
                                        className="h-12"
                                    />
                                </div>

                                {error && (
                                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isLoading || !shopName}
                                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                            Creating shop...
                                        </>
                                    ) : (
                                        <>
                                            Next
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-4">
                                {error && (
                                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
                                )}

                                {plans.map((plan) => {
                                    const Icon = PLAN_ICONS[plan.id];
                                    return (
                                        <div
                                            key={plan.id}
                                            className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${PLAN_COLORS[plan.id]} ${selectedPlan === plan.id ? "ring-2 ring-green-500" : ""}`}
                                            onClick={() => !isLoading && setSelectedPlan(plan.id)}
                                        >
                                            {plan.popular && (
                                                <Badge className="absolute -top-2 right-4 bg-green-600 text-xs">Popular</Badge>
                                            )}

                                            <div className="flex items-start gap-4">
                                                <div className={`p-2 rounded-lg ${plan.id === "starter" ? "bg-blue-100" : plan.id === "growth" ? "bg-green-100" : "bg-purple-100"}`}>
                                                    <Icon className={`h-5 w-5 ${plan.id === "starter" ? "text-blue-600" : plan.id === "growth" ? "text-green-600" : "text-purple-600"}`} />
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-semibold">{plan.name}</h3>
                                                        <span className="font-bold">${plan.price}/mo</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                                                    <div className="flex gap-4 mt-2 text-xs text-foreground">
                                                        <span>{formatLimit(plan.limits.maxProducts)} products</span>
                                                        <span>{formatLimit(plan.limits.maxCustomers)} customers</span>
                                                        <span>{formatLimit(plan.limits.maxTeamMembers)} team members</span>
                                                    </div>
                                                </div>

                                                {selectedPlan === plan.id && (
                                                    <div className="h-5 w-5 rounded-full bg-green-600 flex items-center justify-center">
                                                        <Check className="h-3 w-3 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                <Button
                                    type="button"
                                    onClick={() => selectedPlan && handleSelectPlan(selectedPlan)}
                                    disabled={isLoading || !selectedPlan}
                                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white mt-4"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            Continue
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </>
                                    )}
                                </Button>

                                <p className="text-xs text-center text-muted-foreground">
                                    Start with a {TRIAL_DURATION_DAYS}-day free trial. No credit card required.
                                </p>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    {invites.map((invite, index) => (
                                        <div key={index} className="space-y-2">
                                            <div className="flex gap-2">
                                                <Input
                                                    type="email"
                                                    placeholder="team@example.com"
                                                    value={invite.email}
                                                    onChange={(e) => updateInvite(index, "email", e.target.value)}
                                                    className="h-10 flex-1"
                                                    disabled={inviteSuccess[index]}
                                                />
                                                <Select
                                                    value={invite.role}
                                                    onValueChange={(value) => updateInvite(index, "role", value)}
                                                    disabled={inviteSuccess[index]}
                                                >
                                                    <SelectTrigger className="w-28 h-10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                        <SelectItem value="member">Staff</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {invites.length > 1 && !inviteSuccess[index] && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeInvite(index)}
                                                        className="h-10 w-10 text-muted-foreground hover:text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {inviteSuccess[index] && (
                                                    <div className="h-10 w-10 flex items-center justify-center text-green-600">
                                                        <Check className="h-5 w-5" />
                                                    </div>
                                                )}
                                            </div>
                                            {inviteErrors[index] && (
                                                <p className="text-sm text-red-600">{inviteErrors[index]}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addInvite}
                                    className="w-full h-10"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add another
                                </Button>

                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => router.push("/dashboard")}
                                        className="w-1/4 h-12"
                                    >
                                        Skip
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={sendAllInvites}
                                        disabled={isLoading}
                                        className="w-3/4 h-12 bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="h-4 w-4 mr-2" />
                                                Finish Setup
                                            </>
                                        )}
                                    </Button>
                                </div>

                                <p className="text-xs text-center text-muted-foreground">
                                    Team members will receive an email with a link to join your shop.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function BusinessOnboardingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <BusinessOnboardingContent />
        </Suspense>
    );
}
