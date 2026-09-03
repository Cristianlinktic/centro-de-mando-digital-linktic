"use client";

import { useEffect, useState } from "react";
import type { Post } from "@/lib/instagram-types";
import { Dashboard } from "@/components/instagram/Dashboard";

export default function PerfilesActoresPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPosts(data.posts ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-white/10 border-t-pink-500 animate-spin" />
          <p className="text-slate-400 text-sm">Cargando datos de Instagram…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-bg min-h-screen flex items-center justify-center p-6">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 max-w-md text-center">
          <p className="text-red-400 font-semibold mb-1">Error al cargar datos</p>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg min-h-screen">
      <Dashboard posts={posts} account="actoreselectorales" />
    </div>
  );
}
