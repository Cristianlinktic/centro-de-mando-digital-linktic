"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ContentItem } from "./types";
import { HOURS, platformById, STATUS_DOT } from "./types";
import { startOfWeek, addDays, isSameDay, dateOf, parseISO, WEEKDAY_LABELS } from "./date-utils";

export function WeekView({
  cursorDate,
  items,
  editing,
  now,
  onSelectDay,
  onAddSlot,
  onItemClick,
}: {
  cursorDate: Date;
  items: ContentItem[];
  editing: boolean;
  now: Date | null;
  onSelectDay: (date: Date) => void;
  onAddSlot: (date: Date, hour: string) => void;
  onItemClick: (item: ContentItem) => void;
}) {
  const weekStart = startOfWeek(cursorDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="panel border border-[#1e2240] rounded-2xl neon-frame overflow-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
      <div className="grid min-w-[900px]" style={{ gridTemplateColumns: "70px repeat(7, minmax(120px, 1fr))" }}>
        <div className="sticky top-0 left-0 z-30 border-b border-r border-[#2a2a4a] panel" />
        {days.map((day, i) => {
          const isToday = now ? isSameDay(now, day) : false;
          return (
            <button
              key={i}
              onClick={() => onSelectDay(day)}
              className="sticky top-0 z-20 flex flex-col items-center border-b border-l border-[#2a2a4a] panel py-2 hover:bg-white/5 transition-colors"
            >
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#8892b0]">{WEEKDAY_LABELS[i]}</span>
              <span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${isToday ? "bg-[#0094ff] text-white" : "text-[#e4e9f5]"}`}>
                {day.getDate()}
              </span>
            </button>
          );
        })}

        {HOURS.map((hour) => {
          const rowH = parseInt(hour.split(":")[0], 10);
          return (
            <div key={hour} className="contents">
              <div className="sticky left-0 z-10 min-h-[80px] border-b border-r border-[#1e2240] flex items-start justify-center pt-1 panel text-[11px] font-mono font-bold text-[#aab3cf]">
                {hour}
              </div>
              {days.map((day, i) => {
                const isActiveHour = now ? isSameDay(now, day) && now.getHours() === rowH : false;
                const progressPct = now ? (now.getMinutes() / 60) * 100 : 0;
                const cellItems = items
                  .filter((it) => isSameDay(parseISO(dateOf(it)), day) && it.time?.startsWith(hour.split(":")[0]))
                  .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

                return (
                  <div
                    key={i}
                    className={`group relative min-h-[80px] border-b border-l border-[#1e2240] hover:bg-white/5 transition-colors ${
                      isActiveHour ? "bg-amber-500/5" : ""
                    }`}
                    onClick={() => editing && onAddSlot(day, hour)}
                  >
                    {isActiveHour && (
                      <div className="pointer-events-none absolute left-0 right-0 h-0.5 bg-rose-400 z-10" style={{ top: `${progressPct}%` }} />
                    )}
                    <div className="space-y-1 p-1">
                      {cellItems.map((item) => {
                        const plat = platformById[item.platform];
                        const statusColor = STATUS_DOT[item.status] || "#aab3cf";
                        return (
                          <div
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onItemClick(item);
                            }}
                            title={item.status}
                            className="rounded px-1.5 py-1 text-[10px] cursor-pointer hover:brightness-125"
                            style={{ backgroundColor: `${plat.color}22`, borderLeft: `2px solid ${plat.color}` }}
                          >
                            <div className="flex items-center gap-1 text-[#e4e9f5]">
                              <FontAwesomeIcon icon={plat.icon} className="h-2.5 w-2.5 shrink-0" style={{ color: plat.color }} />
                              <span className="font-mono text-[#aab3cf]">{item.time}</span>
                              <span
                                className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ backgroundColor: statusColor }}
                              />
                            </div>
                            <p className="truncate text-[#c0c8de]">{item.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
