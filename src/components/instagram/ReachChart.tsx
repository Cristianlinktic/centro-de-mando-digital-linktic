"use client";

import { useState } from "react";
import type { Post } from "@/lib/instagram-types";
import { formatDate, formatNumber, typeLabel } from "@/lib/instagram-analytics";

export function ReachChart({ posts, onSelect }: { posts: Post[]; onSelect: (p: Post) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  if (posts.length === 0) return null;

  const ordered = [...posts].sort((a, b) => a.date.localeCompare(b.date));
  const max = Math.max(...ordered.map((p) => p.reach), 1);
  const W = 100;
  const gap = 0.4;
  const bw = (W - gap * (ordered.length - 1)) / ordered.length;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} 40`} preserveAspectRatio="none" className="h-56 w-full">
        {ordered.map((p, i) => {
          const h = (p.reach / max) * 38;
          const x = i * (bw + gap);
          const isReel = p.type === "REELS";
          return (
            <rect
              key={p.id}
              x={x}
              y={40 - h}
              width={bw}
              height={h}
              rx={0.3}
              className={`cursor-pointer transition-opacity ${
                isReel ? "fill-fuchsia-500" : "fill-[#00e1ff]"
              } ${hover === null || hover === i ? "opacity-100" : "opacity-40"}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect(p)}
            />
          );
        })}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-lg border border-[#2a2a4a] bg-[#0a0a1c]/95 px-3 py-2 text-xs shadow-xl">
          <div className="font-medium text-white">{formatDate(ordered[hover].date)}</div>
          <div className="text-[#aab3cf]">
            {typeLabel(ordered[hover].type)} · Alcance{" "}
            <span className="text-white">{formatNumber(ordered[hover].reach)}</span>
          </div>
        </div>
      )}
      <div className="mt-2 flex items-center justify-between text-xs text-[#8892b0]">
        <span>{formatDate(ordered[0].date)}</span>
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-fuchsia-500" /> Reel
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-[#00e1ff]" /> Carrusel
          </span>
        </div>
        <span>{formatDate(ordered[ordered.length - 1].date)}</span>
      </div>
    </div>
  );
}
