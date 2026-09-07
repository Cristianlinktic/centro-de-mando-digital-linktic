"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AuthProvider } from "@/components/auth-provider";
import { AccessSync } from "@/components/auth/AccessSync";
import { Analyst } from "@/components/instagram/Analyst";
import { Toaster } from "@/components/ui/toast";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Páginas que se muestran sin el shell (sidebar/header).
  const isBarePage = pathname === "/login" || pathname === "/sin-acceso";

  if (isBarePage) {
    return <>{children}</>;
  }

  return (
    <AuthProvider>
      <AccessSync />
      <div className="app-aurora" aria-hidden="true" />
      <SidebarProvider className="h-screen overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex flex-col h-screen overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
      {/* Martha: disponible en todo el Centro de Mando Digital (Interno y Externo). */}
      <Analyst />
      <Toaster />
    </AuthProvider>
  );
}
