/**
 * Un mes. Server Component: consulta en el servidor y entrega el resultado ya
 * resuelto al componente de pintado, en vez de mandar los datos dentro del
 * bundle de JavaScript como hacía la versión con datos simulados.
 */
import { getMes } from "@/lib/mailing-prueba/data";
import { MesView } from "./mes-view";

export default async function MailingMesPage({ params }: { params: Promise<{ mes: string }> }) {
  const { mes } = await params;
  const data = await getMes(mes);
  return <MesView mes={mes} data={data} />;
}
