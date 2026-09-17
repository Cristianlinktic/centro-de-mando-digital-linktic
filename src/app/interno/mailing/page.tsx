/**
 * Índice de meses. Server Component: los datos se piden en el servidor y
 * llegan renderizados, en vez de viajar dentro del bundle de JavaScript como
 * hacía la versión con datos simulados. Con las cifras reales eso ya no era
 * viable — un solo mes son decenas de miles de filas.
 *
 * El pintado vive en `meses-view.tsx` porque necesita handlers de ratón.
 */
import { listMeses } from "@/lib/mailing/data";
import { MesesView } from "./meses-view";

export default async function MailingIndexPage() {
  const meses = await listMeses();
  return <MesesView meses={meses} />;
}
