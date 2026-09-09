"use client";

import { useMemo, useState } from "react";
import type { Post } from "@/lib/instagram-types";
import {
  computeTotals,
  breakdownByType,
  topHashtags,
  formatNumber,
  formatDate,
  typeLabel,
  weekday,
  clip,
} from "@/lib/instagram-analytics";
import { ReachChart } from "./ReachChart";
import { PostDetail } from "./PostDetail";
import { PostImage } from "./PostImage";
import { SOCIAL_PLATFORMS, type SocialPlatform } from "@/lib/social-platforms";

type SortKey = "date" | "reach" | "engagement" | "engagementRate" | "likes" | "comments";
type View = "gallery" | "table";

// Instagram conserva exactamente su filtro de siempre (Reel/Carrusel); para
// las demás redes el filtro se arma con los tipos reales que traiga Windsor.
const INSTAGRAM_TYPE_OPTIONS = ["ALL", "REELS", "CAROUSEL_ALBUM"];

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card-glass overflow-hidden rounded-2xl p-5">
      <div className="text-sm text-[#aab3cf]">{label}</div>
      <div className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-white truncate">{value}</div>
      {sub && <div className="mt-1 text-xs text-[#8892b0]">{sub}</div>}
    </div>
  );
}

export function Dashboard({ posts, account, platform }: { posts: Post[]; account: string; platform: SocialPlatform }) {
  const isInstagram = platform === "instagram";
  const cfg = SOCIAL_PLATFORMS[platform];

  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("reach");
  const [selected, setSelected] = useState<Post | null>(null);
  const [view, setView] = useState<View>("gallery");

  const typeOptions = useMemo(() => {
    if (isInstagram) return INSTAGRAM_TYPE_OPTIONS;
    return ["ALL", ...Array.from(new Set(posts.map((p) => p.type))).sort()];
  }, [isInstagram, posts]);

  const filtered = useMemo(
    () => (typeFilter === "ALL" ? posts : posts.filter((p) => p.type === typeFilter)),
    [posts, typeFilter]
  );

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      if (sortKey === "date") return b.date.localeCompare(a.date);
      return (b[sortKey] as number) - (a[sortKey] as number);
    });
    return arr;
  }, [filtered, sortKey]);

  const totals = useMemo(() => computeTotals(filtered), [filtered]);
  const byType = useMemo(() => breakdownByType(posts), [posts]);
  const tags = useMemo(() => topHashtags(posts), [posts]);
  const dateRange = useMemo(() => {
    if (posts.length === 0) return "";
    const dates = posts.map((p) => p.date).sort();
    return `${formatDate(dates[0])} — ${formatDate(dates[dates.length - 1])}`;
  }, [posts]);

  const sortButtons: { key: SortKey; label: string }[] = [
    { key: "reach", label: "Alcance" },
    { key: "engagement", label: "Engagement" },
    { key: "engagementRate", label: "ER %" },
    { key: "likes", label: "Likes" },
    { key: "comments", label: "Comentarios" },
    { key: "date", label: "Fecha" },
  ];

  return (
    <div className="page-pad text-white">
      {/* Header */}
      <header className="mb-8">
        <div className="flex gap-2 flex-wrap mb-3">
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-full border flex items-center gap-1"
            style={{ background: cfg.accentBg, color: cfg.accent, borderColor: cfg.accentBorder }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.accent }} />
            {cfg.label.toUpperCase()}
          </span>
          <span className="bg-[#1e2240] text-[#75ddff] text-[10px] px-2 py-1 rounded-full border border-[#0094ff]/20 font-bold uppercase">
            LINKTIC
          </span>
        </div>
        <h1 className="page-title font-bold tracking-tight text-white break-words">
          @{account}
        </h1>
        <p className="mt-1 text-[#aab3cf]">{dateRange} · {posts.length} publicaciones</p>
      </header>

      {/* KPIs */}
      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Publicaciones" value={formatNumber(totals.count)} />
        <KpiCard label="Alcance total" value={formatNumber(totals.reach)} sub={`prom. ${formatNumber(totals.avgReach)}/post`} />
        <KpiCard label="Likes" value={formatNumber(totals.likes)} />
        <KpiCard label="Comentarios" value={formatNumber(totals.comments)} />
        <KpiCard label="Guardados + Comp." value={formatNumber(totals.saved + totals.shares)} sub={`${totals.saved} guard · ${totals.shares} comp`} />
        <KpiCard label="ER promedio" value={`${totals.avgEngagementRate}%`} />
      </section>

      {/* Chart */}
      <section className="mb-8 rounded-2xl border border-[#1e2240] panel p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">Alcance por publicación en el tiempo</h2>
        <ReachChart posts={filtered} onSelect={setSelected} platform={platform} />
        <p className="mt-3 text-xs text-[#8892b0]">Haz clic en una barra para ver el detalle de esa publicación.</p>
      </section>

      {/* Type breakdown + hashtags */}
      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#1e2240] panel p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">Por tipo de contenido</h2>
          <div className="space-y-3">
            {byType.map((t) => {
              const maxReach = Math.max(...byType.map((x) => x.avgReach), 1);
              return (
                <div key={t.type}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-white">
                      {typeLabel(t.type)} <span className="text-[#8892b0]">· {t.count} posts</span>
                    </span>
                    <span className="text-[#aab3cf]">
                      {formatNumber(t.avgReach)} alcance prom · ER {t.avgEngagementRate}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(t.avgReach / maxReach) * 100}%`,
                        background: isInstagram ? (t.type === "REELS" ? cfg.accent : "rgb(56,189,248)") : cfg.accent,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-[#1e2240] panel p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">Hashtags más usados</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((h) => (
              <span
                key={h.tag}
                title={`${h.count} usos · ${formatNumber(h.avgReach)} alcance prom`}
                className="rounded-full border border-[#00e1ff]/20 bg-[#00e1ff]/10 px-3 py-1.5 text-sm text-[#00e1ff]"
              >
                {h.tag} <span className="text-[#00e1ff]/60">×{h.count}</span>
              </span>
            ))}
            {tags.length === 0 && <span className="text-sm text-[#8892b0]">Sin hashtags detectados.</span>}
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {typeOptions.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                typeFilter !== t ? "bg-white/5 text-[#c0c8de] hover:bg-white/10" : ""
              }`}
              style={typeFilter === t ? { background: cfg.accent, color: "#fff" } : undefined}
            >
              {t === "ALL" ? "Todas" : typeLabel(t)}
            </button>
          ))}
          <div className="ml-1 flex gap-1 rounded-lg bg-white/5 p-0.5">
            {(["gallery", "table"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                  view === v ? "bg-white/10 text-white" : "text-[#c0c8de] hover:bg-white/10"
                }`}
              >
                {v === "gallery" ? "🖼️ Galería" : "☰ Tabla"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-[#8892b0]">Ordenar por:</span>
          {sortButtons.map((s) => (
            <button
              key={s.key}
              onClick={() => setSortKey(s.key)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                sortKey !== s.key ? "bg-white/5 text-[#c0c8de] hover:bg-white/10" : ""
              }`}
              style={sortKey === s.key ? { background: cfg.accent, color: "#fff" } : undefined}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {/* Gallery */}
      {view === "gallery" && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {sorted.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="group overflow-hidden rounded-2xl border border-[#1e2240] panel text-left transition hover:border-[#2b62ff]/40"
            >
              <PostImage post={p} platform={platform} className="aspect-square w-full" rounded="rounded-none" />
              <div className="p-3">
                <div className="flex items-center justify-between text-xs text-[#8892b0]">
                  <span>{formatDate(p.date)}</span>
                  <span>ER {p.engagementRate}%</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-white">{formatNumber(p.reach)}</span>
                  <span className="text-[#aab3cf]">alcance</span>
                </div>
                <div className="mt-1 flex gap-3 text-xs text-[#8892b0]">
                  <span>❤ {formatNumber(p.likes)}</span>
                  <span>💬 {formatNumber(p.comments)}</span>
                  <span>🔖 {formatNumber(p.saved)}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-[#aab3cf]">
                  {clip(p.caption, 90) || "(sin texto)"}
                </p>
              </div>
            </button>
          ))}
        </section>
      )}

      {/* Table */}
      {view === "table" && (
        <section className="overflow-hidden rounded-2xl border border-[#1e2240]">
          <p className="px-4 pt-3 pb-1 text-[10px] text-[#8892b0] sm:hidden">Desliza para ver más →</p>
          <div className="relative">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="panel text-xs uppercase tracking-wide text-[#aab3cf]">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Publicación</th>
                  <th className="px-4 py-3 text-right">Alcance</th>
                  <th className="px-4 py-3 text-right">Likes</th>
                  <th className="px-4 py-3 text-right">Coment.</th>
                  <th className="px-4 py-3 text-right">ER</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className="cursor-pointer border-t border-[#1e2240] hover:bg-white/5"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-[#c0c8de]">
                      {formatDate(p.date)}
                      <span className="ml-1 text-[#8892b0]">{weekday(p.date)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={
                          isInstagram
                            ? p.type === "REELS"
                              ? { background: "rgba(225,48,108,0.15)", color: "#f9a8d4" }
                              : { background: "rgba(56,189,248,0.12)", color: "#75ddff" }
                            : { background: `${cfg.accent}26`, color: cfg.accent }
                        }
                      >
                        {typeLabel(p.type)}
                      </span>
                    </td>
                    <td className="max-w-[280px] truncate px-4 py-3 text-[#c0c8de]">
                      {clip(p.caption, 70) || "(sin texto)"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-white">{formatNumber(p.reach)}</td>
                    <td className="px-4 py-3 text-right text-[#c0c8de]">{formatNumber(p.likes)}</td>
                    <td className="px-4 py-3 text-right text-[#c0c8de]">{formatNumber(p.comments)}</td>
                    <td className="px-4 py-3 text-right text-[#c0c8de]">{p.engagementRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="scroll-fade-x-edge sm:hidden" aria-hidden="true" />
          </div>
        </section>
      )}

      <p className="mt-6 text-center text-xs text-[#8892b0]">
        Datos agregados de {cfg.label} vía Windsor.ai. {cfg.disclaimerOwner} no expone la identidad de quienes dan like o comentan.
      </p>

      <PostDetail post={selected} platform={platform} onClose={() => setSelected(null)} />
    </div>
  );
}
