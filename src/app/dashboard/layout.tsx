import { cookies } from "next/headers";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const defaultOpen = cookieStore.get("sidebar:state")?.value === "true";

    return (
        <SidebarProvider defaultOpen={defaultOpen !== false}>
            <AppSidebar />
            <SidebarInset className="bg-gradient-to-br from-gray-50 to-gray-100">
                {/* Decorative Background Elements */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 -left-40 w-80 h-80 bg-green-600/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl" />
                </div>

                <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-white/80 backdrop-blur-sm px-6">
                    <SidebarTrigger />
                    <div className="flex flex-1 items-center justify-between">
                        <h1 className="text-lg font-semibold">
                            <span className="text-yellow-400">Tanga</span>
                            <span className="text-green-600">biz</span>
                        </h1>
                        {/* Add notifications, search, etc here */}
                    </div>
                </header>
                <main className="relative z-1 flex-1 p-8">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
