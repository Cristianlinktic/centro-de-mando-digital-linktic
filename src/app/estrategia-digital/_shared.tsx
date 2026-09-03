import Link from "next/link";
import { Card } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel, faSpinner } from "@fortawesome/free-solid-svg-icons";

export function LoadingCampaign() {
  return (
    <div className="h-64 flex items-center justify-center text-slate-500 font-mono tracking-widest uppercase text-sm">
      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-3" /> Cargando estrategia digital…
    </div>
  );
}

export function EmptyCampaign() {
  return (
    <Card className="bg-[#0b101d] border border-white/5 p-10 rounded-2xl text-center">
      <FontAwesomeIcon icon={faFileExcel} className="text-4xl text-slate-600 mb-4" />
      <h3 className="text-lg font-bold text-slate-200 mb-2">Aún no hay una campaña cargada</h3>
      <p className="text-sm text-slate-500 mb-6">
        Importa un plan de pauta en Excel para empezar a ver el dashboard de estrategia digital.
      </p>
      <Link
        href="/estrategia-digital/importar"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
      >
        Ir a Importar
      </Link>
    </Card>
  );
}

export function round(n: number, d: number) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}
