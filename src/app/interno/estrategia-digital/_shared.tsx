"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { TabLoadingScreen } from "@/components/bird-loading/tab-loading-screen";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel } from "@fortawesome/free-solid-svg-icons";
import type { CampaignCategory } from "@/lib/campana/types";

/** Categoría activa (RRSS o Medios), leída de ?tipo= — cada sub-pestaña de
 *  Estrategia Publicitaria la usa para pedir/guardar la campaña correcta. */
export function useCategoria(): CampaignCategory {
  const sp = useSearchParams();
  return sp.get("tipo") === "medios" ? "medios" : "rrss";
}

export function LoadingCampaign() {
  const tipo = useCategoria();
  return (
    <TabLoadingScreen
      section={`Estrategia Publicitaria · ${tipo === "medios" ? "Medios" : "RRSS"}`}
      fullScreen={false}
    />
  );
}

export function EmptyCampaign() {
  const tipo = useCategoria();
  return (
    <Card className="panel border border-[#1e2240] p-6 sm:p-10 rounded-2xl text-center">
      <FontAwesomeIcon icon={faFileExcel} className="text-4xl text-[#8892b0] mb-4" />
      <h3 className="text-lg font-bold text-[#e4e9f5] mb-2">Aún no hay una campaña cargada</h3>
      <p className="text-sm text-[#8892b0] mb-6">
        Importa un plan de pauta en Excel para empezar a ver el dashboard de {tipo === "medios" ? "medios" : "RRSS"}.
      </p>
      <Link
        href={`/interno/estrategia-digital/importar?tipo=${tipo}`}
        className="inline-flex items-center gap-2 bg-[#0094ff] hover:bg-[#0080e6] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
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
