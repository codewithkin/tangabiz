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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

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

    // TODO: Get actual user role from session/database
    // For now, default to admin
    const userRole = "admin"; // This should come from session.user.role

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
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-green-600 text-white font-bold text-sm">
                                    T
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-bold text-base">
                                        <span className="text-yellow-400">Tanga</span>
                                        <span className="text-green-600">biz</span>
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        Smart POS
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
                                <SidebarMenuItem key={item.title}>
                                    {item.items ? (
                                        // Item with submenu
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <SidebarMenuButton className="hover:bg-gray-300/50">
                                                    <item.icon className="h-4 w-4" />
                                                    <span>{item.title}</span>
                                                    <ChevronDown className="ml-auto h-4 w-4" />
                                                </SidebarMenuButton>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                side="right"
                                                align="start"
                                                className="w-48"
                                            >
                                                {item.items.map((subItem) => (
                                                    <DropdownMenuItem key={subItem.title} asChild>
                                                        <a href={subItem.url} className="cursor-pointer">
                                                            {subItem.title}
                                                        </a>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    ) : (
                                        // Regular item
                                        <SidebarMenuButton asChild className="hover:bg-gray-300/50">
                                            <a href={item.url}>
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                            </a>
                                        </SidebarMenuButton>
                                    )}
                                </SidebarMenuItem>
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
                                    <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-green-600 text-white">
                                        <User2 className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col gap-0.5 leading-none">
                                        <span className="font-semibold text-sm">
                                            {session?.user?.name || session?.user?.email || "User"}
                                        </span>
                                        <span className="text-xs text-muted-foreground capitalize">
                                            {userRole}
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
