"use client";

import { usePathname } from "next/navigation";
import { useRef } from "react";

export type AppSection = "interno" | "externo";

/**
 * Sección de alto nivel activa (Interno/Externo), para el switcher del
 * sidebar y el tema --tab-accent* (ver [data-section="externo"] en
 * globals.css). Rutas que no son ni /interno ni /externo (/admin/usuarios,
 * por ejemplo — no pertenece a ninguna de las dos) mantienen la última
 * sección real visitada en vez de saltar a un valor por defecto, para no
 * "sacar" visualmente al usuario de la pestaña en la que estaba.
 */
export function useActiveSection(): AppSection {
  const pathname = usePathname();
  const lastRef = useRef<AppSection>("externo");

  if (pathname.startsWith("/interno")) lastRef.current = "interno";
  else if (pathname.startsWith("/externo")) lastRef.current = "externo";

  return lastRef.current;
}
