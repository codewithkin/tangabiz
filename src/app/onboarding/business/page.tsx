"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Plus, Trash2, UserPlus, Check } from "lucide-react";
import { useRouter } from "next/navigation";
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

const TOTAL_STEPS = 2;

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
                    className={`h-2 w-12 rounded-full transition-colors ${step <= currentStep ? "bg-green-500" : "bg-gray-300"
                        }`}
                />
            ))}
        </div>
    );
}

export default function BusinessOnboardingPage() {
    const router = useRouter();
    useSessionRedirect(true);

    const [currentStep, setCurrentStep] = useState(1);
    const [shopName, setShopName] = useState("");
    const [organizationId, setOrganizationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Step 2 state
    const [invites, setInvites] = useState<Invite[]>([{ email: "", role: "member" }]);
    const [inviteErrors, setInviteErrors] = useState<string[]>([]);
    const [inviteSuccess, setInviteSuccess] = useState<boolean[]>([]);

    const handleCreateShop = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const slug = shopName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

            const { data, error: createError } = await authClient.organization.create({
                name: shopName,
                slug,
            });

            if (createError) {
                setError(createError.message || "Failed to create shop");
                setIsLoading(false);
                return;
            }

            if (data?.id) {
                await authClient.organization.setActive({
                    organizationId: data.id,
                });
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
        // Clear error when editing
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
            // First, ensure user account exists
            await fetch("/api/users/ensure", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: invite.email }),
            });

            // Now send the invitation
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
            finishOnboarding();
            return;
        }

        setIsLoading(true);
        for (let i = 0; i < invites.length; i++) {
            if (invites[i].email && !inviteSuccess[i]) {
                await sendInvite(i);
            }
        }
        setIsLoading(false);
    };

    const finishOnboarding = () => {
        router.push("/dashboard");
    };

    const handleSkip = () => {
        router.push("/dashboard");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8">
            {/* Decorative elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 -left-40 w-80 h-80 bg-green-600/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md space-y-6">
                {/* Step indicator */}
                <div className="text-center text-sm text-muted-foreground mb-2">
                    Step {currentStep} of {TOTAL_STEPS}
                </div>
                <ProgressIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

                {/* Back button */}
                {currentStep === 1 && (
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                )}

                {currentStep === 2 && (
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentStep(1)}
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
                                <CardDescription>
                                    Set up your business to start using Tangabiz POS
                                </CardDescription>
                            </>
                        )}

                        {currentStep === 2 && (
                            <>
                                <CardTitle className="text-2xl">Invite your team</CardTitle>
                                <CardDescription>
                                    Add team members to help manage {shopName}
                                </CardDescription>
                            </>
                        )}
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Step 1: Create Shop */}
                        {currentStep === 1 && (
                            <form onSubmit={handleCreateShop} className="space-y-6">
                                <div className="space-y-2">
                                    <label
                                        htmlFor="shopName"
                                        className="block text-sm font-medium text-foreground"
                                    >
                                        Shop name
                                    </label>
                                    <Input
                                        id="shopName"
                                        name="shopName"
                                        type="text"
                                        required
                                        value={shopName}
                                        onChange={(e) => setShopName(e.target.value)}
                                        placeholder="My Awesome Shop"
                                        className="h-12"
                                    />
                                </div>

                                {error && (
                                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                                        {error}
                                    </div>
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

                        {/* Step 2: Invite Team */}
                        {currentStep === 2 && (
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
                                        variant="outline"
                                        onClick={handleSkip}
                                        className="flex-1 h-12"
                                    >
                                        Skip for now
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={async () => {
                                            await sendAllInvites();
                                            finishOnboarding();
                                        }}
                                        disabled={isLoading}
                                        className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="h-4 w-4 mr-2" />
                                                Send Invites
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
