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
        <div className="flex gap-2 mb-2">
          <span className="bg-[#1e293b] text-blue-400 text-[10px] px-2 py-0.5 rounded-full border border-blue-500/20 uppercase font-black">
            ESTRATEGIA PUBLICITARIA
          </span>
        </div>
        <h1 className="text-3xl font-bold mb-1 gradient-text text-glow-blue">Estrategia Publicitaria</h1>
        <p className="text-slate-400 text-sm">Planeación, seguimiento y pauta digital multicanal.</p>
      </div>

      <nav className="flex flex-wrap gap-1 mb-6 border-b border-white/5 pb-1">
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
                  ? "text-blue-400 border-b-2 border-blue-500 bg-white/5"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
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
