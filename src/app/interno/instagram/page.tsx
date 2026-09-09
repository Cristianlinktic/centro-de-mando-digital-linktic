"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { Post } from "@/lib/instagram-types";
import { Dashboard } from "@/components/instagram/Dashboard";
import { TabLoadingScreen } from "@/components/bird-loading/tab-loading-screen";
import { SOCIAL_PLATFORM_ORDER, SOCIAL_PLATFORMS, type SocialPlatform } from "@/lib/social-platforms";

// Misma cuenta para las 3 redes por ahora — Instagram ya trae datos reales de
// Windsor.ai; Facebook y TikTok quedan con la misma estructura lista para
// cuando se conecten esas cuentas ahí (solo hay que ajustar este handle).
const ACCOUNTS: Record<SocialPlatform, string> = {
  instagram: "actoreselectorales",
  facebook: "actoreselectorales",
  tiktok: "actoreselectorales",
};

type TabData = {
  status: "idle" | "loading" | "ok" | "error";
  posts: Post[];
  error: string | null;
};

const INITIAL_DATA: Record<SocialPlatform, TabData> = {
  instagram: { status: "idle", posts: [], error: null },
  facebook: { status: "idle", posts: [], error: null },
  tiktok: { status: "idle", posts: [], error: null },
};

export default function PerfilesActoresPage() {
  const [tab, setTab] = useState<SocialPlatform>("instagram");
  const [data, setData] = useState<Record<SocialPlatform, TabData>>(INITIAL_DATA);

  useEffect(() => {
    if (data[tab].status !== "idle") return;
    setData((d) => ({ ...d, [tab]: { ...d[tab], status: "loading" } }));
    fetch(`/api/posts?platform=${tab}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData((d) => ({ ...d, [tab]: { status: "ok", posts: json.posts ?? [], error: null } }));
      })
      .catch((e) => setData((d) => ({ ...d, [tab]: { status: "error", posts: [], error: e.message } })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const current = data[tab];

  return (
    <div className="page-bg min-h-screen">
      <nav className="flex gap-1 border-b border-[#1e2240] page-pad pb-0 pt-4 w-fit max-w-full overflow-x-auto">
        {SOCIAL_PLATFORM_ORDER.map((p) => {
          const cfg = SOCIAL_PLATFORMS[p];
          const active = tab === p;
          return (
            <button
              key={p}
              onClick={() => setTab(p)}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors border-b-2 ${
                active ? "bg-white/5" : "border-transparent text-[#8892b0] hover:text-[#c0c8de] hover:bg-white/5"
              }`}
              style={active ? { color: cfg.accent, borderColor: cfg.accent } : undefined}
            >
              <FontAwesomeIcon icon={cfg.icon} className="h-3.5 w-3.5" />
              {cfg.label}
            </button>
          );
        })}
      </nav>

      {current.status === "idle" || current.status === "loading" ? (
        <TabLoadingScreen section={`Conversación en Redes · ${SOCIAL_PLATFORMS[tab].label}`} fullScreen={false} />
      ) : current.status === "error" ? (
        <div className="flex items-center justify-center page-pad">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 max-w-md text-center">
            <p className="text-red-400 font-semibold mb-1">No se pudo cargar {SOCIAL_PLATFORMS[tab].label}</p>
            <p className="text-[#8892b0] text-sm">{current.error}</p>
          </div>
        </div>
      ) : (
        <Dashboard posts={current.posts} account={ACCOUNTS[tab]} platform={tab} />
      )}
    </div>
  );
}
