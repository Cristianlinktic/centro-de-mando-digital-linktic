"use client";

import { useState } from "react";
import { MediosSection } from "./medios-section";
import { PrensaSection } from "./prensa-section";

const TABS = [
  { key: "medios", label: "Medios" },
  { key: "prensa", label: "Prensa" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function MediosPage() {
  const [tab, setTab] = useState<TabKey>("medios");

  return (
    <div className="page-bg text-white p-6">
      <nav className="flex gap-1 mb-6 border-b border-white/5 pb-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors ${
              tab === t.key
                ? "text-blue-400 border-b-2 border-blue-500 bg-white/5"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "medios" ? <MediosSection /> : <PrensaSection />}
    </div>
  );
}
