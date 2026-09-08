"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/interno/estrategia-digital", label: "Resumen" },
  { href: "/interno/estrategia-digital/diario", label: "Diario" },
  { href: "/interno/estrategia-digital/canales", label: "Canales" },
  { href: "/interno/estrategia-digital/proyecciones", label: "Proyecciones" },
  { href: "/interno/estrategia-digital/seguimiento", label: "Seguimiento" },
  { href: "/interno/estrategia-digital/configuracion", label: "Configuración" },
  { href: "/interno/estrategia-digital/importar", label: "Importar" },
];

export default function EstrategiaDigitalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="page-bg text-white p-6">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold mb-1 gradient-text text-glow-blue">Estrategia Publicitaria</h1>
        <p className="text-[#aab3cf] text-sm">Planeación, seguimiento y pauta digital multicanal.</p>
      </div>

      <nav className="flex flex-wrap gap-1 mb-6 border-b border-[#1e2240] pb-1">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/interno/estrategia-digital"
              ? pathname === tab.href
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors ${
                isActive
                  ? "text-[#75ddff] border-b-2 border-[#0094ff] bg-white/5"
                  : "text-[#8892b0] hover:text-[#c0c8de] hover:bg-white/5"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
