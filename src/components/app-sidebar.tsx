"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  Newspaper,
  Share2,
  Globe2,
  Copyright,
  Crosshair,
  Users,
  MapPinned,
  Rss,
  FileSearch,
  CalendarDays,
  Target,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { ChevronLeft } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram } from "@fortawesome/free-brands-svg-icons";
import { useAuth } from "@/components/auth-provider";
import { screenKeyForPath } from "@/lib/auth/rbac";

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  ShieldCheck,
  Newspaper,
  Share2,
  Globe2,
  MapPinned,
  Users,
  Rss,
  FileSearch,
  CalendarDays,
  Target,
};

// Navegación unificada — Centro de Mando Digital LinkTIC
const navItems = [
  { path: "/mapa", label: "Mapa Global", icon: "Globe2", badge: "NEW", badgeBg: "hsl(213 60% 18%)", badgeText: "hsl(213 85% 62%)" },
  { path: "/nacional", label: "Conversación Nacional", icon: "MapPinned", badge: "NEW", badgeBg: "hsl(213 60% 18%)", badgeText: "hsl(213 85% 62%)" },
  { path: "/testigos", label: "Testigos Electorales", icon: "ShieldCheck" },
  { path: "/medios", label: "Conversación en Medios", icon: "Newspaper" },
  { path: "/social", label: "Conversación en Redes", icon: "Share2", badge: "LIVE", badgeBg: "#2eb88a", badgeText: "#fff" },
  { path: "/mapa-colombia", label: "Mapa de Colombia", icon: "MapPinned", badge: "IG", badgeBg: "#2a1020", badgeText: "#E1306C" },
  { path: "/instagram", label: "Instagram", icon: "Instagram" },
  { path: "/redes-sociales", label: "Redes Sociales", icon: "Rss" },
  { path: "/prensa", label: "Análisis de Prensa", icon: "FileSearch" },
  { path: "/parrilla", label: "Parrilla de Contenidos", icon: "CalendarDays" },
  { path: "/estrategia-digital", label: "Estrategia Digital", icon: "Target" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  const { role, screens } = useAuth();

  // El superadmin ve todo; el resto solo las pantallas que tiene asignadas.
  const canSee = (path: string) => {
    if (role === "superadmin") return true;
    const key = screenKeyForPath(path);
    return key ? screens.includes(key) : true;
  };
  const visibleItems = navItems.filter((item) => canSee(item.path));

  return (
    <Sidebar collapsible="icon" className="glass border-r border-border/60">
      <SidebarHeader className="border-b border-border/40 px-4 py-4">
        <div className="flex items-center gap-2">
          {/* Cabecera estática: Centro de Mando Digital LinkTIC */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-linktic-blue shrink-0">
              <Crosshair className="h-3 w-3 text-linktic-gold" />
            </div>
            <div className="flex flex-col items-start flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="font-heading text-sm font-semibold text-foreground truncate max-w-full">Centro de Mando</span>
              <span className="text-[10px] text-muted-foreground truncate max-w-full">Digital LinkTIC</span>
            </div>
          </div>

          <button
            onClick={toggleSidebar}
            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors group-data-[collapsible=icon]:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2 px-2 group-data-[collapsible=icon]:hidden">
          Centro de Mando Digital LinkTIC
        </p>
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = icons[item.icon];
            const isActive =
              pathname === item.path || pathname.startsWith(item.path + "/");
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`sidebar-item flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive && item.icon === "Instagram"
                    ? "active bg-[rgba(225,48,108,0.12)] text-[#E1306C] border-l-2 border-[#E1306C] pl-[calc(0.75rem-2px)] shadow-[0_0_16px_rgba(225,48,108,0.18)]"
                    : isActive
                      ? "active bg-[hsl(213_85%_48%/0.15)] text-[hsl(213_85%_48%)] border-l-2 border-[hsl(213_85%_48%)] pl-[calc(0.75rem-2px)] shadow-[0_0_16px_hsl(213_85%_48%/0.18)]"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
              >
                {item.icon === "Instagram" ? (
                  <FontAwesomeIcon
                    icon={faInstagram}
                    className={`h-4 w-4 shrink-0 ${isActive ? "text-[#E1306C]" : ""}`}
                  />
                ) : Icon ? (
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[hsl(213_85%_48%)]" : ""}`} />
                ) : null}
                <span className="flex-1 truncate group-data-[collapsible=icon]:hidden">
                  {item.label}
                </span>
                {item.badge && (
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full group-data-[collapsible=icon]:hidden"
                    style={{
                      backgroundColor: item.badgeBg,
                      color: item.badgeText,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {role === "superadmin" && (
          <>
            <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mt-5 mb-2 px-2 group-data-[collapsible=icon]:hidden">
              Administración
            </p>
            <nav className="space-y-1">
              <Link
                href="/admin/usuarios"
                className={`sidebar-item flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  pathname.startsWith("/admin/usuarios")
                    ? "active bg-[hsl(213_85%_48%/0.15)] text-[hsl(213_85%_48%)] border-l-2 border-[hsl(213_85%_48%)] pl-[calc(0.75rem-2px)]"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Users className={`h-4 w-4 shrink-0 ${pathname.startsWith("/admin/usuarios") ? "text-[hsl(213_85%_48%)]" : ""}`} />
                <span className="flex-1 truncate group-data-[collapsible=icon]:hidden">Usuarios</span>
              </Link>
            </nav>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 px-4 py-3 group-data-[collapsible=icon]:hidden">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Copyright className="h-3 w-3" />
          <span>By LinkTIC © 2026</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
