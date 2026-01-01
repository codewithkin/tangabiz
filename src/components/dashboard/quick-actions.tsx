"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, FileText, ShoppingCart, Users, Package, BarChart, UsersRound } from "lucide-react";

export function QuickActions() {
    const router = useRouter();

    return (
        <div className="flex items-center gap-2">
            {/* Create Actions */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium shadow-md"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Create
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => router.push("/dashboard/reports/new")}>
                        <BarChart className="h-4 w-4 mr-2" />
                        Report
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/dashboard/team/new")}>
                        <UsersRound className="h-4 w-4 mr-2" />
                        Team
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Add New Actions */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        className="bg-green-600 hover:bg-green-700 text-white font-medium shadow-md"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => router.push("/dashboard/sales/new")}>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Sale
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/dashboard/customers/new")}>
                        <Users className="h-4 w-4 mr-2" />
                        Customer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/dashboard/products/new")}>
                        <Package className="h-4 w-4 mr-2" />
                        Product
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
