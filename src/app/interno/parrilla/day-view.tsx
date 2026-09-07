"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ContentItem } from "./types";
import { HOURS, TYPE_CHIP, STATUS_CHIP, platformById } from "./types";
import { isSameDay, dateOf, parseISO } from "./date-utils";

export function DayView({
  date,
  items,
  editing,
  now,
  onAddSlot,
  onItemClick,
}: {
  date: Date;
  items: ContentItem[];
  editing: boolean;
  now: Date | null;
  onAddSlot: (hour: string) => void;
  onItemClick: (item: ContentItem) => void;
}) {
  const dayItems = items.filter((i) => isSameDay(parseISO(dateOf(i)), date));
  const isToday = now ? isSameDay(now, date) : false;

  return (
    <div className="bg-[#0b101d] border border-white/5 rounded-2xl neon-frame overflow-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
      <div className="grid" style={{ gridTemplateColumns: "80px 1fr" }}>
        {HOURS.map((hour) => {
          const rowH = parseInt(hour.split(":")[0], 10);
          const isActiveHour = isToday && now ? now.getHours() === rowH : false;
          const progressPct = now ? (now.getMinutes() / 60) * 100 : 0;
          const cellItems = dayItems
            .filter((i) => i.time?.startsWith(hour.split(":")[0]))
            .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

          return (
            <div key={hour} className="contents">
              <div
                className={`sticky left-0 z-10 min-h-[90px] border-b border-r border-white/5 flex items-start justify-center pt-2 text-sm font-mono font-bold ${
                  isActiveHour ? "bg-amber-500/10 text-amber-300" : "bg-[#0b101d] text-slate-400"
                }`}
              >
                {hour}
              </div>
              <div
                className="group relative min-h-[90px] border-b border-white/5 hover:bg-white/5 transition-colors"
                onClick={() => editing && onAddSlot(hour)}
              >
                {isActiveHour && (
                  <div className="pointer-events-none absolute left-0 right-0 h-0.5 bg-rose-400 z-10" style={{ top: `${progressPct}%` }} />
                )}
                {editing && (
                  <button
                    className="absolute right-1.5 top-1.5 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddSlot(hour);
                    }}
                    title="Añadir contenido"
                  >
                    +
                  </button>
                )}
                <div className="flex flex-wrap gap-2 p-2">
                  {cellItems.map((item) => {
                    const plat = platformById[item.platform];
                    return (
                      <div
                        key={item.id}
                        className="w-56 rounded-lg p-2 cursor-pointer hover:brightness-110 transition-all"
                        style={{ backgroundColor: "rgba(255,255,255,0.04)", borderLeft: `3px solid ${plat.color}` }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemClick(item);
                        }}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: plat.color }}>
                            <FontAwesomeIcon icon={plat.icon} className="h-3 w-3" /> {plat.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">{item.time}</span>
                        </div>
                        <div className="mb-1 flex flex-wrap gap-1">
                          <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${TYPE_CHIP[item.type] || "bg-white/10 text-slate-400"}`}>
                            {item.type}
                          </span>
                          <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${STATUS_CHIP[item.status] || "bg-white/10 text-slate-400"}`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-200 leading-tight line-clamp-3">{item.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
