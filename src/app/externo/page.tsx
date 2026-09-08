import { Globe2 } from "lucide-react";

export default function ExternoPage() {
  return (
    <div className="page-bg text-white h-full flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#0094ff]/10 border border-[#0094ff]/20 flex items-center justify-center">
        <Globe2 className="h-8 w-8 text-[#75ddff]" />
      </div>
      <div>
        <h1 className="font-heading text-2xl font-bold gradient-text text-glow-blue mb-2">Centro de Mando Digital Externo</h1>
        <p className="text-[#aab3cf] text-sm max-w-md">
          Todavía no hay módulos aquí. Esta sección se irá poblando próximamente.
        </p>
      </div>
    </div>
  );
}
