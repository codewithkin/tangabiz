"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
    Plus,
    Search,
    Users,
    Loader2,
    MoreHorizontal,
    Pencil,
    Trash2,
    Mail,
    Shield,
    Crown,
    UserCog,
    User,
    Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";

interface TeamMember {
    id: string;
    userId: string;
    role: string;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
    };
}

interface Invitation {
    id: string;
    email: string;
    role: string;
    status: string;
    expiresAt: string;
    createdAt: string;
}

export default function TeamPage() {
    const [members, setMembers] = React.useState<TeamMember[]>([]);
    const [invitations, setInvitations] = React.useState<Invitation[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [deleteId, setDeleteId] = React.useState<string | null>(null);
    const [deletingInvitation, setDeletingInvitation] = React.useState<string | null>(null);
    const [editMember, setEditMember] = React.useState<TeamMember | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const { data: session } = authClient.useSession();

    const fetchTeam = React.useCallback(async () => {
        try {
            const [membersRes, invitationsRes] = await Promise.all([
                fetch("/api/team/members"),
                fetch("/api/team/invitations/pending"),
            ]);

            if (membersRes.ok) {
                const data = await membersRes.json();
                setMembers(data.members || []);
            }

            if (invitationsRes.ok) {
                const data = await invitationsRes.json();
                setInvitations(data.invitations || []);
            }
        } catch (error) {
            console.error("Error fetching team:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchTeam();
    }, [fetchTeam]);

    const handleDeleteMember = async () => {
        if (!deleteId) return;

        try {
            const res = await fetch(`/api/team/members/${deleteId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setMembers(members.filter((m) => m.id !== deleteId));
            }
        } catch (error) {
            console.error("Error removing member:", error);
        } finally {
            setDeleteId(null);
        }
    };

    const handleCancelInvitation = async (invitationId: string) => {
        setDeletingInvitation(invitationId);
        try {
            const res = await fetch(`/api/team/invitations/${invitationId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setInvitations(invitations.filter((i) => i.id !== invitationId));
            }
        } catch (error) {
            console.error("Error canceling invitation:", error);
        } finally {
            setDeletingInvitation(null);
        }
    };

    const handleUpdateRole = async () => {
        if (!editMember) return;

        setIsSaving(true);
        try {
            const res = await fetch(`/api/team/members/${editMember.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: editMember.role }),
            });

            if (res.ok) {
                setMembers(members.map((m) =>
                    m.id === editMember.id ? { ...m, role: editMember.role } : m
                ));
                setIsEditDialogOpen(false);
                setEditMember(null);
            }
        } catch (error) {
            console.error("Error updating member:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case "owner":
                return <Crown className="h-4 w-4 text-yellow-600" />;
            case "admin":
                return <Shield className="h-4 w-4 text-blue-600" />;
            case "manager":
                return <UserCog className="h-4 w-4 text-green-600" />;
            default:
                return <User className="h-4 w-4 text-gray-600" />;
        }
    };

    const getRoleBadge = (role: string) => {
        const variants: Record<string, string> = {
            owner: "bg-yellow-100 text-yellow-800",
            admin: "bg-blue-100 text-blue-800",
            manager: "bg-green-100 text-green-800",
            member: "bg-gray-100 text-gray-800",
        };

        return (
            <Badge className={variants[role] || variants.member}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
            </Badge>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const filteredMembers = members.filter(
        (m) =>
            m.user.name?.toLowerCase().includes(search.toLowerCase()) ||
            m.user.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Team</h2>
                    <p className="text-muted-foreground">
                        Manage your team members and their roles
                    </p>
                </div>
                <Button asChild className="bg-green-600 hover:bg-green-700">
                    <Link href="/dashboard/team/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Invite Members
                    </Link>
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Members
                        </CardTitle>
                        <Users className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{members.length}</div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Admins
                        </CardTitle>
                        <Shield className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {members.filter((m) => m.role === "owner" || m.role === "admin").length}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Staff
                        </CardTitle>
                        <User className="h-4 w-4 text-gray-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {members.filter((m) => m.role === "member").length}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Pending Invites
                        </CardTitle>
                        <Clock className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{invitations.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Members Table */}
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                        People who have access to your organization
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Search */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search members..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                        </div>
                    ) : filteredMembers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Users className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">No team members found</h3>
                            <p className="text-muted-foreground mb-4">
                                {search ? "Try a different search term" : "Invite your first team member"}
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="w-[70px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredMembers.map((member) => (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                        {member.user.image ? (
                                                            <img
                                                                src={member.user.image}
                                                                alt={member.user.name || ""}
                                                                className="h-10 w-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-green-600 font-semibold">
                                                                {(member.user.name || member.user.email)[0].toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">
                                                            {member.user.name || "Unnamed"}
                                                            {member.userId === session?.user?.id && (
                                                                <span className="text-muted-foreground ml-2">(You)</span>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {member.user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getRoleIcon(member.role)}
                                                    {getRoleBadge(member.role)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDate(member.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                {member.role !== "owner" && member.userId !== session?.user?.id && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setEditMember(member);
                                                                    setIsEditDialogOpen(true);
                                                                }}
                                                            >
                                                                <Pencil className="h-4 w-4 mr-2" />
                                                                Change Role
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => setDeleteId(member.id)}
                                                                className="text-red-600"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Remove
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pending Invitations */}
            {invitations.length > 0 && (
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle>Pending Invitations</CardTitle>
                        <CardDescription>
                            Invitations that haven't been accepted yet
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Expires</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invitations.map((invitation) => (
                                        <TableRow key={invitation.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    {invitation.email}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDate(invitation.expiresAt)}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleCancelInvitation(invitation.id)}
                                                    disabled={deletingInvitation === invitation.id}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    {deletingInvitation === invitation.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        "Cancel"
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove this team member? They will lose access to your organization.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteMember}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Role Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Role</DialogTitle>
                        <DialogDescription>
                            Update the role for {editMember?.user.name || editMember?.user.email}
                        </DialogDescription>
                    </DialogHeader>
                    {editMember && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select
                                    value={editMember.role}
                                    onValueChange={(value) =>
                                        setEditMember({ ...editMember, role: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="manager">Manager</SelectItem>
                                        <SelectItem value="member">Staff</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    {editMember.role === "admin" && "Admins have full access to all features"}
                                    {editMember.role === "manager" && "Managers can view reports and manage inventory"}
                                    {editMember.role === "member" && "Staff can only access POS and view their sales"}
                                </p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateRole}
                            disabled={isSaving}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
