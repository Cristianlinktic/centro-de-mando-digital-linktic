// Bloques reutilizables para paneles de módulos sin integración de datos
// todavía (Estrategia Mailing, Conversación en Canales…): cada tarjeta
// documenta qué métrica va ahí y cómo se calcula, en vez de mostrar cifras
// inventadas.

export function KpiCard({ label, formula }: { label: string; formula: string }) {
  return (
    <div className="card-glass overflow-hidden rounded-2xl p-5">
      <div className="text-sm text-[#aab3cf]">{label}</div>
      <div className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[#4b5165]">—</div>
      <div className="mt-1 text-xs text-[#6b7280]">{formula}</div>
    </div>
  );
}

export function KpiGroup({ title, items }: { title: string; items: { label: string; formula: string }[] }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#8892b0]">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>
    </section>
  );
}

export function EmptyChartPanel({
  height = "h-56",
  message = "Sin datos aún — se completa al conectar la fuente de datos.",
}: {
  height?: string;
  message?: string;
}) {
  return (
    <div className={`flex ${height} items-center justify-center rounded-xl border border-dashed border-[#2a2a4a] bg-white/[0.02] p-6`}>
      <p className="max-w-xs text-center text-xs text-[#6b7280]">{message}</p>
    </div>
  );
}
