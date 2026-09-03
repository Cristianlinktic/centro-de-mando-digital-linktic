"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Suscribe la vista a los cambios de Postgres (Supabase Realtime) de una o más
 * tablas y dispara `onChange` (normalmente un refetch) en cuanto entran datos
 * nuevos, sin recargar la página.
 *
 * - Debounce: una ráfaga de eventos (p. ej. un "Guardar todo" que hace 33
 *   upserts) se colapsa en un único refresco.
 * - `paused`: mientras el editor de administración está abierto se pausa el
 *   refresco para no pisar los cambios que el admin está escribiendo; al cerrar,
 *   si quedaron cambios pendientes, se aplica el refresco una sola vez.
 *
 * Requiere que las tablas estén en la publicación `supabase_realtime`
 * (ver supabase_realtime_setup.sql).
 */
export function useRealtimeRefresh(
  tables: string[],
  onChange: () => void,
  options?: { paused?: boolean; debounceMs?: number }
) {
  const { paused = false, debounceMs = 800 } = options || {};
  const onChangeRef = useRef(onChange);
  const pausedRef = useRef(paused);
  const pendingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mantener la referencia actual sin re-suscribir el canal en cada render.
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const tablesKey = tables.join("-");

  useEffect(() => {
    const run = () => {
      // Si el editor está abierto, aplazar y marcar pendiente.
      if (pausedRef.current) {
        pendingRef.current = true;
        return;
      }
      pendingRef.current = false;
      onChangeRef.current();
    };

    const schedule = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(run, debounceMs);
    };

    const channel = supabase.channel(`rt-${tablesKey}`);
    tablesKey.split("-").forEach((table) => {
      channel.on("postgres_changes", { event: "*", schema: "centro_mando", table }, schedule);
    });
    channel.subscribe();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      supabase.removeChannel(channel);
    };
  }, [tablesKey, debounceMs]);

  // Al reanudar (cerrar el editor) con cambios pendientes, refrescar una vez.
  useEffect(() => {
    pausedRef.current = paused;
    if (!paused && pendingRef.current) {
      pendingRef.current = false;
      onChangeRef.current();
    }
  }, [paused]);
}
