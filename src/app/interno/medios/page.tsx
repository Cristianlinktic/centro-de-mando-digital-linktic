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
      <nav className="flex gap-1 mb-6 border-b border-[#1e2240] pb-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors ${
              tab === t.key
                ? "text-[#75ddff] border-b-2 border-[#0094ff] bg-white/5"
                : "text-[#8892b0] hover:text-[#c0c8de] hover:bg-white/5"
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
