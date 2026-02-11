"use client";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/hooks/useTheme";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import { StarsBackground } from "@/components/StarsBackground";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <AdminAuthProvider>
                    <TooltipProvider>
                        <StarsBackground />
                        <Toaster />
                        <Sonner />
                        {children}
                    </TooltipProvider>
                </AdminAuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
