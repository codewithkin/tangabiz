"use client";

import * as React from "react";
import dynamic from "next/dynamic";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Send,
    Mail,
    Loader2,
    Trash2,
    Eye,
    Edit,
    Users,
    CheckCircle,
    XCircle,
    Clock,
} from "lucide-react";
import type { EditorRef, EmailEditorProps } from "react-email-editor";

// Dynamically import EmailEditor to avoid SSR issues
const EmailEditor = dynamic(() => import("react-email-editor"), {
    ssr: false,
    loading: () => (
        <div className="h-[500px] flex items-center justify-center bg-gray-50 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
    ),
});

interface Campaign {
    id: string;
    subject: string;
    content: string;
    status: string;
    recipientCount: number;
    sentCount: number;
    failedCount: number;
    sentAt: string | null;
    createdAt: string;
    _count?: {
        recipients: number;
    };
}

export default function EmailMarketingPage() {
    const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isEditorOpen, setIsEditorOpen] = React.useState(false);
    const [editingCampaign, setEditingCampaign] = React.useState<Campaign | null>(null);
    const [subject, setSubject] = React.useState("");
    const [isSaving, setIsSaving] = React.useState(false);
    const [isSending, setIsSending] = React.useState<string | null>(null);
    const [deleteId, setDeleteId] = React.useState<string | null>(null);
    const [previewCampaign, setPreviewCampaign] = React.useState<Campaign | null>(null);
    const emailEditorRef = React.useRef<EditorRef>(null);

    const fetchCampaigns = React.useCallback(async () => {
        try {
            const res = await fetch("/api/email-campaigns");
            const data = await res.json();

            if (res.ok) {
                setCampaigns(data.campaigns || []);
            }
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    const openNewCampaign = () => {
        setEditingCampaign(null);
        setSubject("");
        setIsEditorOpen(true);
    };

    const openEditCampaign = (campaign: Campaign) => {
        setEditingCampaign(campaign);
        setSubject(campaign.subject);
        setIsEditorOpen(true);
    };

    const handleSaveCampaign = async () => {
        if (!subject.trim()) {
            alert("Please enter a subject line");
            return;
        }

        setIsSaving(true);

        try {
            // Export HTML from editor
            let htmlContent = "";

            if (emailEditorRef.current) {
                // biome-ignore lint/suspicious/noExplicitAny: react-email-editor types are incomplete
                const unlayer = emailEditorRef.current as any;
                await new Promise<void>((resolve) => {
                    unlayer.exportHtml((data: { html: string }) => {
                        htmlContent = data.html;
                        resolve();
                    });
                });
            }

            const endpoint = editingCampaign
                ? `/api/email-campaigns/${editingCampaign.id}`
                : "/api/email-campaigns";

            const method = editingCampaign ? "PUT" : "POST";

            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject,
                    content: htmlContent || "<p>Email content</p>",
                }),
            });

            if (res.ok) {
                setIsEditorOpen(false);
                fetchCampaigns();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to save campaign");
            }
        } catch (error) {
            console.error("Save error:", error);
            alert("Failed to save campaign");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendCampaign = async (campaignId: string) => {
        setIsSending(campaignId);

        try {
            const res = await fetch(`/api/email-campaigns/${campaignId}/send`, {
                method: "POST",
            });

            if (res.ok) {
                const data = await res.json();
                alert(`Campaign is being sent to ${data.recipientCount} customers`);
                fetchCampaigns();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to send campaign");
            }
        } catch (error) {
            console.error("Send error:", error);
            alert("Failed to send campaign");
        } finally {
            setIsSending(null);
        }
    };

    const handleDeleteCampaign = async () => {
        if (!deleteId) return;

        try {
            const res = await fetch(`/api/email-campaigns/${deleteId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setCampaigns(campaigns.filter((c) => c.id !== deleteId));
            }
        } catch (error) {
            console.error("Delete error:", error);
        } finally {
            setDeleteId(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "draft":
                return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Draft</Badge>;
            case "sending":
                return <Badge className="bg-blue-100 text-blue-700"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Sending</Badge>;
            case "sent":
                return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Sent</Badge>;
            case "failed":
                return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const onEditorLoad: EmailEditorProps["onLoad"] = () => {
        // Editor loaded - could load saved design here
        if (editingCampaign?.content) {
            // If editing, we'd need to save/load the design JSON
            // For simplicity, we're just saving HTML output
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Email Marketing</h2>
                    <p className="text-muted-foreground">
                        Create and send email campaigns to your customers
                    </p>
                </div>
                <Button
                    onClick={openNewCampaign}
                    className="bg-green-600 hover:bg-green-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Campaign
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Campaigns
                        </CardTitle>
                        <Mail className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{campaigns.length}</div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Emails Sent
                        </CardTitle>
                        <Send className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {campaigns.reduce((sum, c) => sum + c.sentCount, 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Draft Campaigns
                        </CardTitle>
                        <Clock className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {campaigns.filter((c) => c.status === "draft").length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Campaigns Table */}
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle>Campaigns</CardTitle>
                    <CardDescription>Your email marketing campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">No campaigns yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Create your first email campaign to engage customers
                            </p>
                            <Button
                                onClick={openNewCampaign}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Campaign
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Recipients</TableHead>
                                        <TableHead>Sent/Failed</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="w-[120px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {campaigns.map((campaign) => (
                                        <TableRow key={campaign.id}>
                                            <TableCell>
                                                <div className="font-medium">{campaign.subject}</div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-3 w-3 text-gray-400" />
                                                    {campaign.recipientCount || 0}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {campaign.status === "sent" || campaign.status === "failed" ? (
                                                    <span>
                                                        <span className="text-green-600">{campaign.sentCount}</span>
                                                        {" / "}
                                                        <span className="text-red-600">{campaign.failedCount}</span>
                                                    </span>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {formatDate(campaign.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {campaign.status === "draft" && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openEditCampaign(campaign)}
                                                                title="Edit"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleSendCampaign(campaign.id)}
                                                                disabled={isSending === campaign.id}
                                                                title="Send"
                                                                className="text-green-600 hover:text-green-700"
                                                            >
                                                                {isSending === campaign.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Send className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setPreviewCampaign(campaign)}
                                                        title="Preview"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteId(campaign.id)}
                                                        className="text-red-600 hover:text-red-700"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Email Editor Dialog */}
            <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCampaign ? "Edit Campaign" : "Create New Campaign"}
                        </DialogTitle>
                        <DialogDescription>
                            Design your email using the visual editor below
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject Line</Label>
                            <Input
                                id="subject"
                                placeholder="Enter email subject..."
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
                            <EmailEditor
                                ref={emailEditorRef}
                                onLoad={onEditorLoad}
                                minHeight="100%"
                                options={{
                                    features: {
                                        textEditor: {
                                            spellChecker: true,
                                        },
                                    },
                                    appearance: {
                                        theme: "light",
                                    },
                                }}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditorOpen(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveCampaign}
                            disabled={isSaving}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Campaign"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={!!previewCampaign} onOpenChange={() => setPreviewCampaign(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Preview: {previewCampaign?.subject}</DialogTitle>
                    </DialogHeader>
                    <div className="border rounded-lg overflow-auto max-h-[60vh]">
                        <div
                            dangerouslySetInnerHTML={{
                                __html: previewCampaign?.content || "",
                            }}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this campaign? This action cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteCampaign}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
