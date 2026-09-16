"use client";

import { useEffect, useState } from "react";
import type { Post } from "@/lib/instagram-types";
import { Dashboard } from "@/components/instagram/Dashboard";
import { TabLoadingScreen } from "@/components/bird-loading/tab-loading-screen";
import { useMinLoadingDuration } from "@/hooks/use-min-loading-duration";

// Misma cuenta de Instagram que "Conversación en Redes" (Externo) — solo hay
// una cuenta conectada en Windsor.ai por red, ver /api/posts.
const ACCOUNT = "actoreselectorales";

type TabData = {
  status: "idle" | "loading" | "ok" | "error";
  posts: Post[];
  error: string | null;
};

export default function InternoInstagramPage() {
  const [data, setData] = useState<TabData>({ status: "idle", posts: [], error: null });

  useEffect(() => {
    if (data.status !== "idle") return;
    setData((d) => ({ ...d, status: "loading" }));
    fetch(`/api/posts?platform=instagram`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData({ status: "ok", posts: json.posts ?? [], error: null });
      })
      .catch((e) => setData({ status: "error", posts: [], error: e.message }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showLoading = useMinLoadingDuration(data.status === "idle" || data.status === "loading");

  return (
    <div className="page-bg min-h-screen">
      {showLoading ? (
        <TabLoadingScreen section="Conversación en Redes · Instagram" fullScreen={false} />
      ) : data.status === "error" ? (
        <div className="flex items-center justify-center page-pad">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 max-w-md text-center">
            <p className="text-red-400 font-semibold mb-1">No se pudo cargar Instagram</p>
            <p className="text-[#8892b0] text-sm">{data.error}</p>
          </div>
        </div>
      ) : (
        <Dashboard posts={data.posts} account={ACCOUNT} platform="instagram" />
      )}
    </div>
  );
}
