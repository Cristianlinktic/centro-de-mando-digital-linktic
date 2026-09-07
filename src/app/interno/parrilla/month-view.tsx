"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ContentItem } from "./types";
import { platformById, STATUS_DOT } from "./types";
import { getMonthGrid, isSameDay, dateOf, parseISO, WEEKDAY_LABELS } from "./date-utils";

const MAX_VISIBLE = 3;

export function MonthView({
  cursorDate,
  items,
  onSelectDay,
  onItemClick,
}: {
  cursorDate: Date;
  items: ContentItem[];
  onSelectDay: (date: Date) => void;
  onItemClick: (item: ContentItem) => void;
}) {
  const days = getMonthGrid(cursorDate);
  const today = new Date();
  const currentMonth = cursorDate.getMonth();

  const itemsByDay = (day: Date) => items.filter((i) => isSameDay(parseISO(dateOf(i)), day));

  return (
    <div className="bg-[#0b101d] border border-white/5 rounded-2xl neon-frame overflow-hidden">
      <div className="grid grid-cols-7 border-b border-white/10">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="p-2 text-center text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7" style={{ gridAutoRows: "minmax(110px, 1fr)" }}>
        {days.map((day, idx) => {
          const dayItems = itemsByDay(day);
          const visible = dayItems.slice(0, MAX_VISIBLE);
          const overflow = dayItems.length - visible.length;
          const inMonth = day.getMonth() === currentMonth;
          const isToday = isSameDay(day, today);

          return (
            <button
              key={idx}
              onClick={() => onSelectDay(day)}
              className={`flex flex-col items-stretch border-b border-r border-white/5 p-1.5 text-left transition-colors hover:bg-white/5 ${
                inMonth ? "" : "opacity-40"
              }`}
            >
              <span
                className={`mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                  isToday ? "bg-blue-500 text-white" : "text-slate-400"
                }`}
              >
                {day.getDate()}
              </span>
              <div className="space-y-1">
                {visible.map((item) => {
                  const plat = platformById[item.platform];
                  const statusColor = STATUS_DOT[item.status] || "#64748b";
                  return (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemClick(item);
                      }}
                      title={item.status}
                      className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] text-slate-200 hover:brightness-125"
                      style={{ backgroundColor: `${plat.color}22`, borderLeft: `2px solid ${plat.color}` }}
                    >
                      <FontAwesomeIcon icon={plat.icon} className="h-2.5 w-2.5 shrink-0" style={{ color: plat.color }} />
                      <span className="truncate flex-1">{item.time} {item.description}</span>
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: statusColor }}
                      />
                    </div>
                  );
                })}
                {overflow > 0 && (
                  <span className="block px-1 text-[10px] font-bold text-slate-500">+{overflow} más</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
