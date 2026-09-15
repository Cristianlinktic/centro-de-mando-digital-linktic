"use client";

import { useEffect, useState } from "react";

/**
 * Estira una pantalla de carga para que se muestre al menos `minMs`, aunque
 * el fetch real termine antes — así la animación del ave (aleteo ~2.2s,
 * llenado tipo reloj de arena ~2.3s) alcanza a verse un ciclo completo en
 * vez de parpadear en conexiones rápidas.
 *
 * `isLoading` puede volver a `true` (cambio de pestaña, refetch) y el mínimo
 * se reinicia cada vez. El "encendido" se hace en el mismo render (patrón de
 * estado derivado de React) para que nunca haya un frame de por medio donde
 * ya se intente pintar contenido que todavía no llegó.
 */
export function useMinLoadingDuration(isLoading: boolean, minMs = 3000) {
  const [state, setState] = useState(() => ({ shown: isLoading, since: isLoading ? Date.now() : 0 }));

  if (isLoading && !state.shown) {
    setState({ shown: true, since: Date.now() });
  }

  useEffect(() => {
    if (isLoading || !state.shown) return;

    const remaining = minMs - (Date.now() - state.since);
    if (remaining <= 0) {
      setState({ shown: false, since: 0 });
      return;
    }

    const timer = setTimeout(() => setState({ shown: false, since: 0 }), remaining);
    return () => clearTimeout(timer);
  }, [isLoading, minMs, state.shown, state.since]);

  return state.shown;
}
