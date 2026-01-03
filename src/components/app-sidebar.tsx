"use client";

import * as React from "react";
import {
    LayoutDashboard,
    ShoppingCart,
    Users,
    Package,
    FileText,
    Settings,
    ChevronDown,
    User2,
    LogOut,
    Bell,
    CreditCard,
} from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useActiveOrganization } from "@/lib/auth-client";

// Navigation item type
type NavItem = {
    title: string;
    url: string;
    icon: React.ComponentType<{ className?: string }>;
    items?: {
        title: string;
        url: string;
    }[];
};

// Navigation items based on user role
const adminNavigation: NavItem[] = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Sales",
        url: "/dashboard/sales",
        icon: ShoppingCart,
        items: [
            {
                title: "POS Terminal",
                url: "/dashboard/sales/pos",
            },
            {
                title: "Sales History",
                url: "/dashboard/sales/history",
            },
        ],
    },
    {
        title: "Customers",
        url: "/dashboard/customers",
        icon: Users,
    },
    {
        title: "Inventory",
        url: "/dashboard/inventory",
        icon: Package,
        items: [
            {
                title: "Products",
                url: "/dashboard/inventory/products",
            },
            {
                title: "Stock",
                url: "/dashboard/inventory/stock",
            },
            {
                title: "Categories",
                url: "/dashboard/inventory/categories",
            },
        ],
    },
    {
        title: "Reports",
        url: "/dashboard/reports",
        icon: FileText,
    },
    {
        title: "Team",
        url: "/dashboard/team",
        icon: Users,
    },
    {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
    },
];

const managerNavigation: NavItem[] = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Sales",
        url: "/dashboard/sales",
        icon: ShoppingCart,
        items: [
            {
                title: "POS Terminal",
                url: "/dashboard/sales/pos",
            },
            {
                title: "Sales History",
                url: "/dashboard/sales/history",
            },
        ],
    },
    {
        title: "Customers",
        url: "/dashboard/customers",
        icon: Users,
    },
    {
        title: "Inventory",
        url: "/dashboard/inventory",
        icon: Package,
        items: [
            {
                title: "Products",
                url: "/dashboard/inventory/products",
            },
            {
                title: "Stock",
                url: "/dashboard/inventory/stock",
            },
        ],
    },
    {
        title: "Reports",
        url: "/dashboard/reports",
        icon: FileText,
    },
];

const staffNavigation: NavItem[] = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "POS Terminal",
        url: "/dashboard/sales/pos",
        icon: ShoppingCart,
    },
    {
        title: "Sales History",
        url: "/dashboard/sales/history",
        icon: FileText,
    },
];

export function AppSidebar() {
    const router = useRouter();
    const { state } = useSidebar();
    const { data: session } = authClient.useSession();
    const { data: org } = useActiveOrganization();
    const [orgPlanData, setOrgPlanData] = React.useState<{ plan: string | null; planStartedAt: string | null } | null>(null);

    // Fetch full organization data from database (including plan fields)
    React.useEffect(() => {
        const fetchOrgPlan = async () => {
            if (!org?.id) return;

            try {
                const response = await fetch(`/api/organizations/${org.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setOrgPlanData({
                        plan: data.plan,
                        planStartedAt: data.planStartedAt,
                    });
                }
            } catch (error) {
                console.error("Error fetching org plan data:", error);
            }
        };

        fetchOrgPlan();
    }, [org?.id]);

    // Get organization data and member info
    const orgData = org as any;
    const members = orgData?.members || [];
    const currentMember = members.find((m: any) => m.userId === session?.user?.id);
    const userRole = currentMember?.role || "member";

    const navigation =
        userRole === "admin" ? adminNavigation :
            userRole === "manager" ? managerNavigation :
                staffNavigation;

    const handleSignOut = async () => {
        await authClient.signOut();
        router.push("/auth");
    };

    return (
        <Sidebar collapsible="icon" variant="sidebar">
            {/* Header with logo */}
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <a href="/dashboard" className="flex items-center gap-2">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-600 to-green-700 text-white font-bold text-sm">
                                    {org?.name?.charAt(0)?.toUpperCase() || "T"}
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-bold text-base text-foreground">
                                        {org?.name || "Your Shop"}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {orgPlanData?.plan ? `${orgPlanData.plan.charAt(0).toUpperCase()}${orgPlanData.plan.slice(1)} Plan` : "Loading..."}
                                    </span>
                                </div>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* Main Navigation */}
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navigation.map((item) => (
                                item.items ? (
                                    // Item with submenu - use Collapsible
                                    <Collapsible key={item.title} defaultOpen className="group/collapsible">
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton className="hover:bg-gray-300/50">
                                                    <item.icon className="h-4 w-4" />
                                                    <span>{item.title}</span>
                                                    <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <SidebarMenuSub>
                                                    {item.items.map((subItem) => (
                                                        <SidebarMenuSubItem key={subItem.title}>
                                                            <SidebarMenuSubButton asChild>
                                                                <a href={subItem.url}>
                                                                    <span>{subItem.title}</span>
                                                                </a>
                                                            </SidebarMenuSubButton>
                                                        </SidebarMenuSubItem>
                                                    ))}
                                                </SidebarMenuSub>
                                            </CollapsibleContent>
                                        </SidebarMenuItem>
                                    </Collapsible>
                                ) : (
                                    // Regular item
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild className="hover:bg-gray-300/50">
                                            <a href={item.url}>
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* Footer with user menu */}
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton size="lg" className="hover:bg-gray-300/50">
                                    <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-green-700 text-white">
                                        <User2 className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col gap-0.5 leading-none">
                                        <span className="font-semibold text-sm">
                                            {session?.user?.name || "User"}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {session?.user?.email}
                                        </span>
                                    </div>
                                    <ChevronDown className="ml-auto h-4 w-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                align="start"
                                className="w-[--radix-popper-anchor-width]"
                            >
                                <DropdownMenuItem asChild>
                                    <a href="/dashboard/settings" className="cursor-pointer">
                                        <Settings className="h-4 w-4 mr-2" />
                                        <span>Settings</span>
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a href="/dashboard/billing" className="cursor-pointer">
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        <span>Billing</span>
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
                                    <LogOut className="h-4 w-4 mr-2" />
                                    <span>Sign out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
