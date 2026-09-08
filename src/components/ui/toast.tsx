"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleXmark, faCircleInfo, faXmark } from "@fortawesome/free-solid-svg-icons";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
}

type Listener = (items: ToastItem[]) => void;

let items: ToastItem[] = [];
let listeners: Listener[] = [];
let counter = 0;

function emit() {
  listeners.forEach((l) => l(items));
}

function push(type: ToastType, title: string, description?: string) {
  const id = ++counter;
  items = [...items, { id, type, title, description }];
  emit();
  setTimeout(() => dismiss(id), 4500);
}

function dismiss(id: number) {
  items = items.filter((i) => i.id !== id);
  emit();
}

/** API global para disparar notificaciones desde cualquier componente:
 *  `toast.success("Guardado")`, `toast.error("Algo falló")`. */
export const toast = {
  success: (title: string, description?: string) => push("success", title, description),
  error: (title: string, description?: string) => push("error", title, description),
  info: (title: string, description?: string) => push("info", title, description),
};

const ICONS: Record<ToastType, typeof faCircleCheck> = {
  success: faCircleCheck,
  error: faCircleXmark,
  info: faCircleInfo,
};

const ACCENT: Record<ToastType, string> = {
  success: "border-emerald-500/30 [&_.toast-icon]:text-emerald-400",
  error: "border-rose-500/30 [&_.toast-icon]:text-rose-400",
  info: "border-[#0094ff]/30 [&_.toast-icon]:text-[#75ddff]",
};

/** Móntalo una sola vez en el layout raíz; renderiza la pila de notificaciones. */
export function Toaster() {
  const [list, setList] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.push(setList);
    return () => {
      listeners = listeners.filter((l) => l !== setList);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[200] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2">
      {list.map((item) => (
        <div
          key={item.id}
          className={`glass pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-lg shadow-black/40 animate-in slide-in-from-top-2 fade-in duration-300 ${ACCENT[item.type]}`}
        >
          <FontAwesomeIcon icon={ICONS[item.type]} className="toast-icon mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-snug text-white">{item.title}</p>
            {item.description && (
              <p className="mt-0.5 text-xs leading-snug text-[#aab3cf]">{item.description}</p>
            )}
          </div>
          <button onClick={() => dismiss(item.id)} className="shrink-0 text-[#8892b0] hover:text-white">
            <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
