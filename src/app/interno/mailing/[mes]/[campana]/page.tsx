/**
 * Detalle de una campaña. Server Component: consulta en el servidor y entrega
 * el resultado ya resuelto. Importa aquí porque el detalle de una sola campaña
 * puede ser de miles de filas y no tiene sentido mandarlas dentro del bundle.
 */
import { getCampana } from "@/lib/mailing-prueba/data";
import { CampanaView } from "./campana-view";

export default async function MailingCampanaPage({
  params,
}: { params: Promise<{ mes: string; campana: string }> }) {
  const { mes, campana } = await params;
  const c = await getCampana(mes, campana);
  return <CampanaView mes={mes} c={c} />;
}
