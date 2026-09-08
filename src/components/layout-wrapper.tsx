"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AuthProvider } from "@/components/auth-provider";
import { AccessSync } from "@/components/auth/AccessSync";
import { BackdropOrbs } from "@/components/backdrop-orbs";
import { Analyst } from "@/components/instagram/Analyst";
import { Toaster } from "@/components/ui/toast";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Páginas que se muestran sin el shell (sidebar/header).
  const isBarePage = pathname === "/login" || pathname === "/sin-acceso";
  // Pestaña de alto nivel activa: cambia el acento --tab-accent* (azul en
  // Interno, verde en Externo — ver [data-section="externo"] en globals.css).
  const activeSection = pathname.startsWith("/externo") ? "externo" : "interno";

  if (isBarePage) {
    return <>{children}</>;
  }

  return (
    <AuthProvider>
      <AccessSync />
      <div data-section={activeSection} className="contents">
        <BackdropOrbs fixed grid palette={activeSection === "externo" ? "verde" : "azul"} />
        <SidebarProvider className="h-screen overflow-hidden">
          <AppSidebar />
          <SidebarInset className="flex flex-col h-screen overflow-hidden bg-transparent">
            <AppHeader />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
        {/* Martha: disponible en todo el Centro de Mando Digital (Interno y Externo). */}
        <Analyst />
        <Toaster />
      </div>
    </AuthProvider>
  );
}
