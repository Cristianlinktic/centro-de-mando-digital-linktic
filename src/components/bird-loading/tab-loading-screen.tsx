"use client";

import { useAuth } from "@/components/auth-provider";
import { BirdScene } from "./bird-scene";

type TabLoadingScreenProps = {
  /** Nombre de la sección que se está cargando, ej. "Conversación Nacional". */
  section: string;
  /** false = versión compacta para usar dentro de un layout que ya tiene su
   *  propio fondo (ej. una pestaña anidada, con tabs arriba). Por defecto
   *  ocupa toda la pantalla con el fondo oscuro de LinkTIC. */
  fullScreen?: boolean;
};

/** Pantalla de carga con el ave animada de LinkTIC, usada al entrar a una
 *  pestaña mientras se resuelve su data inicial. Saluda al usuario logueado. */
export function TabLoadingScreen({ section, fullScreen = true }: TabLoadingScreenProps) {
  const { firstName } = useAuth();

  return (
    <div
      className={`flex flex-col items-center justify-center gap-5 text-white ${
        fullScreen ? "h-screen page-bg gap-7" : "min-h-[65vh] w-full"
      }`}
    >
      <BirdScene size={fullScreen ? 130 : 100} />
      <div className="flex flex-col items-center gap-1.5 text-center">
        <p className="font-heading text-lg font-bold text-white">
          {firstName ? `Hola, ${firstName}` : "Hola"}
        </p>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#aab3cf] animate-pulse">
          Cargando la información de {section}
        </p>
      </div>
    </div>
  );
}
