"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCategoria } from "./_shared";

const TABS = [
  { href: "/interno/estrategia-digital", label: "Resumen" },
  { href: "/interno/estrategia-digital/diario", label: "Diario" },
  { href: "/interno/estrategia-digital/canales", label: "Canales" },
  { href: "/interno/estrategia-digital/proyecciones", label: "Proyecciones" },
  { href: "/interno/estrategia-digital/seguimiento", label: "Seguimiento" },
  { href: "/interno/estrategia-digital/configuracion", label: "Configuración" },
  { href: "/interno/estrategia-digital/importar", label: "Importar" },
];

const CATEGORIAS = [
  { value: "rrss", label: "RRSS" },
  { value: "medios", label: "Medios" },
] as const;

export default function EstrategiaDigitalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tipo = useCategoria();

  return (
    <div className="page-bg text-white p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-1 gradient-text text-glow-blue">Estrategia Publicitaria</h1>
          <p className="text-[#aab3cf] text-sm">Planeación, seguimiento y pauta {tipo === "medios" ? "de medios" : "digital multicanal"}.</p>
        </div>

        {/* RRSS / Medios: dos pautas independientes, cada una con su propia data. */}
        <div className="flex gap-1 rounded-full bg-black/20 p-1 ring-1 ring-white/5">
          {CATEGORIAS.map((c) => {
            const active = tipo === c.value;
            return (
              <Link
                key={c.value}
                href={`${pathname}?tipo=${c.value}`}
                className={`rounded-full px-4 py-1.5 text-[11px] font-bold transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-[#0094ff] to-[#00e1ff] text-white shadow-[0_0_12px_rgba(0,148,255,0.55)]"
                    : "text-[#8892b0] hover:text-white hover:bg-white/5"
                }`}
              >
                {c.label}
              </Link>
            );
          })}
        </div>
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
              href={`${tab.href}?tipo=${tipo}`}
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
