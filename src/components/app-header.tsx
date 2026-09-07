"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "./auth-provider";
import { LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { signOut } from "@/app/actions/auth";
import { LinkyIcon } from "@/components/linky-icon";

const pageMeta: Record<string, { title: string }> = {
  "/testigos": { title: "Centro de Mando Digital LinkTIC" },
  "/medios": { title: "Centro de Mando Digital LinkTIC" },
  "/social": { title: "Centro de Mando Digital LinkTIC" },
  "/mapa": { title: "Centro de Mando Digital LinkTIC" },
  "/nacional": { title: "Centro de Mando Digital LinkTIC" },
  "/mapa-colombia": { title: "Centro de Mando Digital LinkTIC" },
  "/instagram": { title: "Centro de Mando Digital LinkTIC" },
  "/redes-sociales": { title: "Centro de Mando Digital LinkTIC" },
  "/prensa": { title: "Centro de Mando Digital LinkTIC" },
  "/parrilla": { title: "Centro de Mando Digital LinkTIC" },
  "/estrategia-digital": { title: "Centro de Mando Digital LinkTIC" },
};

export function AppHeader() {
  const pathname = usePathname();
  const meta = pageMeta[pathname] || pageMeta["/mapa"];
  const { state, isMobile } = useSidebar();
  const { role } = useAuth();
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
      setDate(
        now.toLocaleDateString("es-CO", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      );
    }
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className="glass border-b border-border/60 flex items-center gap-4 px-4 md:px-6"
      style={{ height: 60, position: "sticky", top: 0, zIndex: 10 }}
    >
      {(state === "collapsed" || isMobile) && <SidebarTrigger />}

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <LinkyIcon className="h-7 w-7 shrink-0" />
        <div className="min-w-0">
        <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold truncate gradient-text">{meta.title}</h2>
            {role === "superadmin" ? (
                <Badge variant="neon" className="text-[8px] h-4 px-1 font-black">SUPER</Badge>
            ) : role === "admin" ? (
                <Badge className="bg-blue-600/10 text-blue-400 border-blue-500/20 text-[8px] h-4 px-1 font-black">ADMIN</Badge>
            ) : (
                <Badge className="bg-slate-600/10 text-slate-400 border-white/10 text-[8px] h-4 px-1 font-black">LECTOR</Badge>
            )}
        </div>
        <p className="text-[11px] text-muted-foreground truncate hidden sm:block">By LinkTIC</p>
        </div>
      </div>

      <div className="hidden lg:flex flex-col items-end text-xs">
        <span className="font-semibold tabular-nums">{time}</span>
        <span className="text-[10px] text-muted-foreground capitalize">
          {date}
        </span>
      </div>

      <button 
        onClick={async () => await signOut()}
        className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-white/5 text-slate-500 hover:text-red-400 transition-colors"
        title="Cerrar Sesión"
      >
        <LogOut className="h-4 w-4" />
      </button>

      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-linktic-blue to-linktic-gold flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-[0_0_14px_hsl(213_85%_55%/0.45)] ring-1 ring-white/10">
        {role === "superadmin" ? "SA" : role === "admin" ? "AD" : "LC"}
      </div>
    </header>
  );
}
