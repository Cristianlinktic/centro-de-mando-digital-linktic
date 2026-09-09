"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Newspaper,
  Globe2,
  Copyright,
  Users,
  MessagesSquare,
  CalendarDays,
  Target,
  Building2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { screenKeyForPath } from "@/lib/auth/rbac";
import { LinkyIcon } from "@/components/linky-icon";
import { ColombiaIcon } from "@/components/colombia-icon";

const icons: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Newspaper,
  Globe2,
  Users,
  MessagesSquare,
  CalendarDays,
  Target,
};

// Navegación de la pestaña "Interno" — Centro de Mando Digital LinkTIC.
// `accent` colorea el chip del ícono — cada módulo con su propio tono de la
// paleta LinkTIC ya establecida, para reconocerlos de un vistazo.
const navItems = [
  { path: "/interno/mapa", label: "Mapa Global", icon: "Globe2", accent: "#0094ff" },
  { path: "/interno/mapa-colombia", label: "Conversación Nacional", icon: "Colombia", accent: "#f5b21e" },
  { path: "/interno/medios", label: "Conversación en Medios", icon: "Newspaper", accent: "#a855f7" },
  { path: "/interno/instagram", label: "Conversación en Redes", icon: "MessagesSquare", accent: "#2eb88a" },
  { path: "/interno/parrilla", label: "Parrilla de Contenidos", icon: "CalendarDays", accent: "#75ddff" },
  { path: "/interno/estrategia-digital", label: "Estrategia Publicitaria", icon: "Target", accent: "#00e1ff" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  const { role, screens } = useAuth();

  const activeGroup: "interno" | "externo" = pathname.startsWith("/externo") ? "externo" : "interno";

  // El superadmin ve todo; el resto solo las pantallas que tiene asignadas.
  const canSee = (path: string) => {
    if (role === "superadmin") return true;
    const key = screenKeyForPath(path);
    return key ? screens.includes(key) : true;
  };
  const visibleItems = navItems.filter((item) => canSee(item.path));

  return (
    <Sidebar collapsible="icon" className="glass border-r border-[#1e2240] [&>[data-slot=sidebar-inner]]:bg-transparent">
      <SidebarHeader className="border-b border-[#1e2240] px-4 py-4">
        <div className="flex items-center gap-2">
          {/* Cabecera: ave LinkTIC + título dinámico Interno/Externo (única fuente — no se repite en el header). */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <LinkyIcon className="h-7 w-7 shrink-0" />
            <div className="flex flex-col items-start flex-1 min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
              <span className="text-[13px] font-semibold text-foreground truncate max-w-full">Centro de Mando Digital</span>
              <span className="text-xs font-bold truncate max-w-full gradient-text">
                {activeGroup === "externo" ? "Externo" : "Interno"}
              </span>
            </div>
          </div>

          <button
            onClick={toggleSidebar}
            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors group-data-[collapsible=icon]:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Pestañas de alto nivel: Interno / Externo */}
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-black/20 p-1 ring-1 ring-white/5 group-data-[collapsible=icon]:hidden">
          <Link
            href="/interno/mapa-colombia"
            className={`flex items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-all duration-200 ${
              activeGroup === "interno"
                ? "bg-gradient-to-r from-[var(--tab-accent)] to-[var(--tab-accent-2)] text-white shadow-[0_0_12px_var(--tab-accent-glow)]"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span>Interno</span>
          </Link>
          <Link
            href="/externo"
            className={`flex items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-all duration-200 ${
              activeGroup === "externo"
                ? "bg-gradient-to-r from-[var(--tab-accent)] to-[var(--tab-accent-2)] text-white shadow-[0_0_12px_var(--tab-accent-glow)]"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            <Globe2 className="h-3.5 w-3.5 shrink-0" />
            <span>Externo</span>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2 px-2 group-data-[collapsible=icon]:hidden">
          Paneles
        </p>

        {activeGroup === "interno" ? (
          <nav className="space-y-1">
            {visibleItems.map((item) => {
              const Icon = icons[item.icon];
              const isActive =
                pathname === item.path || pathname.startsWith(item.path + "/");
              const accent = item.accent ?? "#0094ff";
              const iconEl =
                item.icon === "Colombia" ? (
                  <ColombiaIcon className="h-3.5 w-3.5" style={{ color: accent }} />
                ) : Icon ? (
                  <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
                ) : null;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`sidebar-item flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors border-l-2 ${
                    isActive ? "active pl-[calc(0.75rem-2px)]" : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                  style={isActive ? { backgroundColor: `${accent}22`, color: accent, borderColor: accent } : undefined}
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-shadow"
                    style={{
                      backgroundColor: `${accent}1f`,
                      border: `1px solid ${accent}40`,
                      boxShadow: isActive ? `0 0 10px ${accent}66` : undefined,
                    }}
                  >
                    {iconEl}
                  </span>
                  <span className="flex-1 truncate group-data-[collapsible=icon]:hidden">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        ) : (
          <p className="px-3 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            Todavía no hay módulos en Externo.
          </p>
        )}

        {role === "superadmin" && (
          <>
            <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mt-5 mb-2 px-2 group-data-[collapsible=icon]:hidden">
              Administración
            </p>
            <nav className="space-y-1">
              {(() => {
                const usersActive = pathname.startsWith("/admin/usuarios");
                const accent = "#8892b0";
                return (
                  <Link
                    href="/admin/usuarios"
                    className={`sidebar-item flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors border-l-2 ${
                      usersActive ? "active pl-[calc(0.75rem-2px)]" : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                    style={usersActive ? { backgroundColor: `${accent}22`, color: accent, borderColor: accent } : undefined}
                  >
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-shadow"
                      style={{
                        backgroundColor: `${accent}1f`,
                        border: `1px solid ${accent}40`,
                        boxShadow: usersActive ? `0 0 10px ${accent}66` : undefined,
                      }}
                    >
                      <Users className="h-3.5 w-3.5" style={{ color: accent }} />
                    </span>
                    <span className="flex-1 truncate group-data-[collapsible=icon]:hidden">Usuarios</span>
                  </Link>
                );
              })()}
            </nav>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-[#1e2240] px-4 py-3 group-data-[collapsible=icon]:hidden">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Copyright className="h-3 w-3" />
          <span>By LinkTIC © 2026</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
