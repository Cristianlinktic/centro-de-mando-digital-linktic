import { faFacebook, faInstagram, faTiktok, faXTwitter } from "@fortawesome/free-brands-svg-icons";

export interface ViewerComment {
  id: string;
  name: string;
  comment: string;
  timestamp: string;
}

export type PlatformId = "facebook" | "instagram" | "tiktok" | "x";

export type ContentType =
  | "post"
  | "reel"
  | "Story"
  | "Trino"
  | "Trino + imagen"
  | "entrecomillados"
  | "Espacio reservado";

export type ContentStatus =
  | "Publicado"
  | "No Publicado"
  | "Programado"
  | "Rechazado"
  | "Por crear contenido"
  | "Publicado - Eliminado";

export interface ContentItem {
  id: string;
  date: string; // "YYYY-MM-DD" — ausente en publicaciones antiguas (ver dateOf() en date-utils)
  time: string; // "HH:MM", 06:00–22:59
  platform: PlatformId;
  type: ContentType;
  description: string;
  status: ContentStatus;
  duration: number;
  url: string | null;
  comments: string | null;
  kpi: string | null;
  viewer_comments: ViewerComment[];
}

export interface CustomTab {
  id: string;
  key: string;
  label: string;
  table_name: string;
  created_at: string;
}

export const HOURS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
  "19:00", "20:00", "21:00", "22:00",
];

export const PLATFORMS: { id: PlatformId; name: string; icon: typeof faFacebook; color: string }[] = [
  { id: "facebook", name: "Facebook", icon: faFacebook, color: "#3b82f6" },
  { id: "instagram", name: "Instagram", icon: faInstagram, color: "#ec4899" },
  { id: "tiktok", name: "TikTok", icon: faTiktok, color: "#22d3ee" },
  { id: "x", name: "X (Twitter)", icon: faXTwitter, color: "#a78bfa" },
];

export const TYPE_OPTIONS: ContentType[] = [
  "post", "reel", "Story", "Trino", "Trino + imagen", "entrecomillados", "Espacio reservado",
];

export const STATUS_OPTIONS: ContentStatus[] = [
  "Publicado", "No Publicado", "Programado", "Rechazado", "Por crear contenido", "Publicado - Eliminado",
];

export const TYPE_CHIP: Record<string, string> = {
  post: "bg-sky-500/15 text-sky-300",
  reel: "bg-fuchsia-500/15 text-fuchsia-300",
  Story: "bg-violet-500/15 text-violet-300",
  Trino: "bg-cyan-500/15 text-cyan-300",
  "Trino + imagen": "bg-teal-500/15 text-teal-300",
  entrecomillados: "bg-amber-500/15 text-amber-300",
  "Espacio reservado": "bg-white/5 text-slate-400 border border-dashed border-white/20",
};

export const STATUS_CHIP: Record<string, string> = {
  Publicado: "bg-emerald-500/15 text-emerald-300",
  "No Publicado": "bg-white/10 text-slate-400",
  Programado: "bg-sky-500/15 text-sky-300",
  Rechazado: "bg-rose-500/15 text-rose-300",
  "Por crear contenido": "bg-amber-500/15 text-amber-300",
  "Publicado - Eliminado": "bg-rose-500/10 text-rose-400",
};

/** Color sólido por estado, para el punto/borde indicador en las vistas compactas del calendario. */
export const STATUS_DOT: Record<string, string> = {
  Publicado: "#10b981",
  "No Publicado": "#64748b",
  Programado: "#0ea5e9",
  Rechazado: "#f43f5e",
  "Por crear contenido": "#f59e0b",
  "Publicado - Eliminado": "#e11d48",
};

export const inputCls =
  "w-full rounded-lg bg-[#05080f] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50";

export const platformById: Record<PlatformId, (typeof PLATFORMS)[number]> = Object.fromEntries(
  PLATFORMS.map((p) => [p.id, p]),
) as Record<PlatformId, (typeof PLATFORMS)[number]>;
