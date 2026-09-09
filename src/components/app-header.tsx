"use client";

import { useEffect, useState } from "react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "./auth-provider";
import { AvatarUploadModal } from "./avatar-upload-modal";
import { LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { signOut } from "@/app/actions/auth";

export function AppHeader() {
  const { state, isMobile } = useSidebar();
  const { role, avatarUrl } = useAuth();
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [avatarOpen, setAvatarOpen] = useState(false);

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
      className="glass border-b border-[#1e2240] flex items-center gap-4 px-4 md:px-6"
      style={{ height: 60, position: "sticky", top: 0, zIndex: 10 }}
    >
      {(state === "collapsed" || isMobile) && <SidebarTrigger />}

      <div className="flex items-center gap-4 ml-auto">
        <div className="hidden lg:flex flex-col items-end text-xs">
          <span className="font-semibold tabular-nums">{time}</span>
          <span className="text-[10px] text-muted-foreground capitalize">
            {date}
          </span>
        </div>

        <button
          onClick={async () => await signOut()}
          className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-white/5 text-[#8892b0] hover:text-red-400 transition-colors"
          title="Cerrar Sesión"
        >
          <LogOut className="h-4 w-4" />
        </button>

        {/* Rol + avatar agrupados: el badge describe a quién pertenece el círculo de al lado. */}
        <div className="flex items-center gap-2">
          {role === "superadmin" ? (
              <Badge variant="neon" className="hidden sm:inline-flex text-[8px] h-4 px-1 font-black">SUPER</Badge>
          ) : role === "admin" ? (
              <Badge
                className="hidden sm:inline-flex rounded-[4px] border text-[8px] h-4 px-1 font-black"
                style={{ backgroundColor: "var(--tab-accent-wash)", color: "var(--tab-accent-soft)", borderColor: "var(--tab-accent-ring)" }}
              >
                ADMIN
              </Badge>
          ) : (
              <Badge className="hidden sm:inline-flex rounded-[4px] bg-[#131a30] text-[#aab3cf] border-[#2a2a4a] text-[8px] h-4 px-1 font-black">LECTOR</Badge>
          )}
          <button
            onClick={() => setAvatarOpen(true)}
            title="Cambiar foto de perfil"
            className="h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-full ring-1 ring-[#2a2a4a] transition-transform hover:scale-105"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Foto de perfil" className="h-full w-full object-cover" />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-[11px] font-bold text-white"
                style={{
                  backgroundImage: "linear-gradient(135deg, var(--tab-accent), var(--tab-accent-2))",
                  boxShadow: "0 0 14px var(--tab-accent-glow)",
                }}
              >
                {role === "superadmin" ? "SA" : role === "admin" ? "AD" : "LC"}
              </div>
            )}
          </button>
        </div>
      </div>

      {avatarOpen && <AvatarUploadModal onClose={() => setAvatarOpen(false)} />}
    </header>
  );
}
