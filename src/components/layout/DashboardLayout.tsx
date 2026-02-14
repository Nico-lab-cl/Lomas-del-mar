"use client"

import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarTrigger, SidebarRail, SidebarInset } from "@/components/ui/sidebar"
import { Home, BarChart, LogOut, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

export function DashboardLayout({ children, role }: { children: React.ReactNode, role: "ADMIN" | "SELLER" }) {
    const pathname = usePathname()

    return (
        <SidebarProvider>
            <Sidebar collapsible="icon">
                <SidebarHeader className="h-14 flex items-center justify-center border-b">
                    {/* LOGO AREA */}
                    <div className="flex items-center gap-2 font-bold text-[#36595F]">
                        <span className="truncate">Lomas del Mar</span>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu className="p-2 gap-2">
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === (role === "ADMIN" ? "/admin/dashboard" : "/seller/dashboard")} tooltip="Dashboard">
                                <Link href={role === "ADMIN" ? "/admin/dashboard" : "/seller/dashboard"}>
                                    <BarChart />
                                    <span>Dashboard</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        {role === "SELLER" && (
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === "/seller/new-lead"} tooltip="Nuevo Cliente">
                                    <Link href="/seller/new-lead">
                                        <FileText />
                                        <span>Nuevo Cliente</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter className="p-2 border-t gap-2">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Volver al Sitio">
                                <Link href="/">
                                    <Home />
                                    <span>Volver al Sitio</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={() => signOut({ callbackUrl: '/login' })} tooltip="Cerrar Sesión">
                                <LogOut />
                                <span>Cerrar Sesión</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
                <SidebarRail />
            </Sidebar>
            <SidebarInset>
                <header className="flex h-14 items-center gap-2 border-b bg-background px-4">
                    <SidebarTrigger />
                    <div className="flex-1">
                        <h1 className="text-lg font-semibold text-foreground">
                            {role === "ADMIN" ? "Panel de Administración" : "Panel de Vendedor"}
                        </h1>
                    </div>
                </header>
                <div className="flex-1 overflow-auto p-6 bg-muted/20">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
