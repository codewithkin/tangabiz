"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Mail, UserPlus, Trash2 } from "lucide-react";
import Link from "next/link";

interface TeamMember {
    email: string;
    role: string;
}

export default function NewTeamPage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [members, setMembers] = React.useState<TeamMember[]>([
        { email: "", role: "member" },
    ]);

    const addMember = () => {
        setMembers([...members, { email: "", role: "member" }]);
    };

    const removeMember = (index: number) => {
        if (members.length === 1) return;
        setMembers(members.filter((_, i) => i !== index));
    };

    const updateMember = (index: number, field: keyof TeamMember, value: string) => {
        setMembers(
            members.map((member, i) =>
                i === index ? { ...member, [field]: value } : member
            )
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validMembers = members.filter((m) => m.email.trim());
        if (validMembers.length === 0) {
            alert("Please add at least one team member email");
            return;
        }

        setLoading(true);

        try {
            for (const member of validMembers) {
                // First ensure user exists
                const ensureRes = await fetch("/api/users/ensure", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: member.email }),
                });

                if (!ensureRes.ok) {
                    throw new Error(`Failed to prepare user: ${member.email}`);
                }

                // Then send invitation
                const inviteRes = await fetch("/api/team/invite", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: member.email,
                        role: member.role,
                    }),
                });

                if (!inviteRes.ok) {
                    const error = await inviteRes.json();
                    throw new Error(error.error || `Failed to invite: ${member.email}`);
                }
            }

            router.push("/dashboard/team");
        } catch (error) {
            console.error("Invite error:", error);
            alert(error instanceof Error ? error.message : "Failed to send invitations");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/team">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Invite Team Members</h2>
                    <p className="text-muted-foreground">
                        Send invitations to join your organization
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Team Members */}
                    <Card className="border-0 shadow-lg lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Team Members</CardTitle>
                            <CardDescription>
                                Add email addresses and assign roles
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {members.map((member, index) => (
                                <div
                                    key={index}
                                    className="flex items-end gap-4 p-4 border rounded-lg"
                                >
                                    <div className="flex-1 space-y-2">
                                        <Label htmlFor={`email-${index}`}>Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id={`email-${index}`}
                                                type="email"
                                                placeholder="team@example.com"
                                                className="pl-10"
                                                value={member.email}
                                                onChange={(e) =>
                                                    updateMember(index, "email", e.target.value)
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="w-40 space-y-2">
                                        <Label htmlFor={`role-${index}`}>Role</Label>
                                        <Select
                                            value={member.role}
                                            onValueChange={(value) =>
                                                updateMember(index, "role", value)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="member">Staff</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {members.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-600"
                                            onClick={() => removeMember(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={addMember}
                            >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add Another Member
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Role Info & Actions */}
                    <div className="space-y-6">
                        <Card className="border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle>Role Permissions</CardTitle>
                                <CardDescription>
                                    What each role can do
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium text-green-600">Admin</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li>• View all sales & reports</li>
                                        <li>• Manage products & inventory</li>
                                        <li>• Manage customers</li>
                                        <li>• Invite new team members</li>
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-medium text-yellow-600">Staff</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li>• Create new sales</li>
                                        <li>• View own sales only</li>
                                        <li>• View products</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg">
                            <CardContent className="pt-6">
                                <div className="flex flex-col gap-2">
                                    <Button
                                        type="submit"
                                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Sending Invites...
                                            </>
                                        ) : (
                                            <>
                                                <Mail className="mr-2 h-4 w-4" />
                                                Send Invitations
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => router.back()}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    );
}
