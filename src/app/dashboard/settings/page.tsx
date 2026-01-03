"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Settings,
    Store,
    Bell,
    CreditCard,
    Shield,
    Loader2,
    Check,
    AlertTriangle,
    Upload,
    Trash2,
} from "lucide-react";
import { authClient, useActiveOrganization } from "@/lib/auth-client";
import { toast } from "sonner";

interface OrganizationSettings {
    name: string;
    slug: string;
    logo: string | null;
    address: string;
    phone: string;
    email: string;
    taxId: string;
    currency: string;
    timezone: string;
}

interface NotificationSettings {
    lowStockAlerts: boolean;
    dailyReports: boolean;
    weeklyReports: boolean;
    emailNotifications: boolean;
}

export default function SettingsPage() {
    const { data: org, refetch: refetchOrg } = useActiveOrganization();
    const { data: session } = authClient.useSession();

    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState("general");

    const [orgSettings, setOrgSettings] = React.useState<OrganizationSettings>({
        name: "",
        slug: "",
        logo: null,
        address: "",
        phone: "",
        email: "",
        taxId: "",
        currency: "USD",
        timezone: "America/New_York",
    });

    const [notifications, setNotifications] = React.useState<NotificationSettings>({
        lowStockAlerts: true,
        dailyReports: false,
        weeklyReports: true,
        emailNotifications: true,
    });

    const [userSettings, setUserSettings] = React.useState({
        name: "",
        email: "",
    });

    // Load settings
    React.useEffect(() => {
        const loadSettings = async () => {
            if (!org) return;

            try {
                // Load organization settings
                const res = await fetch(`/api/organizations/${org.id}/settings`);
                if (res.ok) {
                    const data = await res.json();
                    setOrgSettings({
                        name: org.name || "",
                        slug: (org as any).slug || "",
                        logo: (org as any).logo || null,
                        address: data.address || "",
                        phone: data.phone || "",
                        email: data.email || "",
                        taxId: data.taxId || "",
                        currency: data.currency || "USD",
                        timezone: data.timezone || "America/New_York",
                    });
                    if (data.notifications) {
                        setNotifications(data.notifications);
                    }
                } else {
                    // Use org data if settings endpoint doesn't exist yet
                    setOrgSettings({
                        name: org.name || "",
                        slug: (org as any).slug || "",
                        logo: (org as any).logo || null,
                        address: "",
                        phone: "",
                        email: "",
                        taxId: "",
                        currency: "USD",
                        timezone: "America/New_York",
                    });
                }

                // Load user settings
                if (session?.user) {
                    setUserSettings({
                        name: session.user.name || "",
                        email: session.user.email || "",
                    });
                }
            } catch (error) {
                console.error("Error loading settings:", error);
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, [org, session]);

    const handleSaveOrgSettings = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/organizations/${org?.id}/settings`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orgSettings),
            });

            if (res.ok) {
                toast.success("Organization settings saved!");
                refetchOrg();
            } else {
                toast.error("Failed to save settings");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveNotifications = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/organizations/${org?.id}/settings`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notifications }),
            });

            if (res.ok) {
                toast.success("Notification settings saved!");
            } else {
                toast.error("Failed to save settings");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveUserSettings = async () => {
        setSaving(true);
        try {
            const { error } = await authClient.updateUser({
                name: userSettings.name,
            });

            if (error) {
                toast.error("Failed to update profile");
            } else {
                toast.success("Profile updated!");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account and organization settings
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="general" className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        <span className="hidden sm:inline">General</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        <span className="hidden sm:inline">Notifications</span>
                    </TabsTrigger>
                    <TabsTrigger value="account" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span className="hidden sm:inline">Account</span>
                    </TabsTrigger>
                    <TabsTrigger value="danger" className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="hidden sm:inline">Danger</span>
                    </TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" className="space-y-6">
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle>Organization Details</CardTitle>
                            <CardDescription>
                                Basic information about your business
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="org-name">Organization Name</Label>
                                    <Input
                                        id="org-name"
                                        value={orgSettings.name}
                                        onChange={(e) =>
                                            setOrgSettings({ ...orgSettings, name: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="org-slug">URL Slug</Label>
                                    <Input
                                        id="org-slug"
                                        value={orgSettings.slug}
                                        onChange={(e) =>
                                            setOrgSettings({ ...orgSettings, slug: e.target.value })
                                        }
                                        disabled
                                    />
                                    <p className="text-xs text-muted-foreground">Cannot be changed</p>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="org-email">Business Email</Label>
                                    <Input
                                        id="org-email"
                                        type="email"
                                        value={orgSettings.email}
                                        onChange={(e) =>
                                            setOrgSettings({ ...orgSettings, email: e.target.value })
                                        }
                                        placeholder="contact@yourbusiness.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="org-phone">Business Phone</Label>
                                    <Input
                                        id="org-phone"
                                        value={orgSettings.phone}
                                        onChange={(e) =>
                                            setOrgSettings({ ...orgSettings, phone: e.target.value })
                                        }
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="org-address">Business Address</Label>
                                <Textarea
                                    id="org-address"
                                    value={orgSettings.address}
                                    onChange={(e) =>
                                        setOrgSettings({ ...orgSettings, address: e.target.value })
                                    }
                                    placeholder="123 Main St, City, State, ZIP"
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="org-taxid">Tax ID / VAT Number</Label>
                                    <Input
                                        id="org-taxid"
                                        value={orgSettings.taxId}
                                        onChange={(e) =>
                                            setOrgSettings({ ...orgSettings, taxId: e.target.value })
                                        }
                                        placeholder="XX-XXXXXXX"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="org-currency">Currency</Label>
                                    <Select
                                        value={orgSettings.currency}
                                        onValueChange={(value) =>
                                            setOrgSettings({ ...orgSettings, currency: value })
                                        }
                                    >
                                        <SelectTrigger id="org-currency">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                            <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                                            <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                                            <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button
                                onClick={handleSaveOrgSettings}
                                disabled={saving}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notification Settings */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle>Notification Preferences</CardTitle>
                            <CardDescription>
                                Choose what notifications you receive
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Low Stock Alerts</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Get notified when products are running low
                                        </p>
                                    </div>
                                    <Switch
                                        checked={notifications.lowStockAlerts}
                                        onCheckedChange={(checked) =>
                                            setNotifications({ ...notifications, lowStockAlerts: checked })
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Daily Reports</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Receive daily sales summary emails
                                        </p>
                                    </div>
                                    <Switch
                                        checked={notifications.dailyReports}
                                        onCheckedChange={(checked) =>
                                            setNotifications({ ...notifications, dailyReports: checked })
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Weekly Reports</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Receive weekly business analytics
                                        </p>
                                    </div>
                                    <Switch
                                        checked={notifications.weeklyReports}
                                        onCheckedChange={(checked) =>
                                            setNotifications({ ...notifications, weeklyReports: checked })
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Email Notifications</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Receive notifications via email
                                        </p>
                                    </div>
                                    <Switch
                                        checked={notifications.emailNotifications}
                                        onCheckedChange={(checked) =>
                                            setNotifications({ ...notifications, emailNotifications: checked })
                                        }
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleSaveNotifications}
                                disabled={saving}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Save Preferences
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Account Settings */}
                <TabsContent value="account" className="space-y-6">
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle>Your Profile</CardTitle>
                            <CardDescription>
                                Manage your personal account settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="user-name">Your Name</Label>
                                    <Input
                                        id="user-name"
                                        value={userSettings.name}
                                        onChange={(e) =>
                                            setUserSettings({ ...userSettings, name: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="user-email">Email</Label>
                                    <Input
                                        id="user-email"
                                        type="email"
                                        value={userSettings.email}
                                        disabled
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Email cannot be changed
                                    </p>
                                </div>
                            </div>

                            <Button
                                onClick={handleSaveUserSettings}
                                disabled={saving}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Update Profile
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle>Security</CardTitle>
                            <CardDescription>
                                Manage your security preferences
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Change Password</p>
                                    <p className="text-sm text-muted-foreground">
                                        Update your password for added security
                                    </p>
                                </div>
                                <Button variant="outline">Change Password</Button>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Two-Factor Authentication</p>
                                    <p className="text-sm text-muted-foreground">
                                        Add an extra layer of security
                                    </p>
                                </div>
                                <Button variant="outline">Enable 2FA</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Danger Zone */}
                <TabsContent value="danger" className="space-y-6">
                    <Card className="border-0 shadow-lg border-red-200">
                        <CardHeader>
                            <CardTitle className="text-red-600">Danger Zone</CardTitle>
                            <CardDescription>
                                Irreversible and destructive actions
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                                <div>
                                    <p className="font-medium">Delete Organization</p>
                                    <p className="text-sm text-muted-foreground">
                                        Permanently delete this organization and all its data
                                    </p>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete your
                                                organization, including all products, customers, sales data, and
                                                team members.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                                                Delete Organization
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>

                            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                                <div>
                                    <p className="font-medium">Delete Your Account</p>
                                    <p className="text-sm text-muted-foreground">
                                        Permanently delete your user account
                                    </p>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete your account. If you're the owner
                                                of any organizations, you must transfer ownership first.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                                                Delete Account
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
