"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, FileText, ShoppingCart, Users, Package, BarChart, UsersRound } from "lucide-react";

export function QuickActions() {
    const handleAction = (action: string) => {
        // TODO: Implement navigation/actions
        console.log(`Action: ${action}`);
    };

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
                    <DropdownMenuItem onClick={() => handleAction("create-report")}>
                        <BarChart className="h-4 w-4 mr-2" />
                        Report
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction("create-team")}>
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
                    <DropdownMenuItem onClick={() => handleAction("add-sale")}>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Sale
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction("add-customer")}>
                        <Users className="h-4 w-4 mr-2" />
                        Customer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction("add-product")}>
                        <Package className="h-4 w-4 mr-2" />
                        Product
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
