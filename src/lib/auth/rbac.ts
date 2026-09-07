/**
 * RBAC puro (sin dependencias de servidor): tipos, normalización de rol,
 * catálogo de pantallas y reglas de acceso. Seguro de importar tanto en
 * componentes cliente como en el proxy (Edge/Node) y en route handlers.
 *
 * Comparte base de datos con "dashboard-unificado": para no chocar en la tabla
 * user_screen_access, las pantallas de ESTE tablero usan el prefijo "lt-tab:".
 */

export const SCREEN_PREFIX = "lt-tab:";

export type AppRole = "superadmin" | "admin" | "viewer";

export interface UserAccess {
  userId: string;
  email: string;
  /** Nombre visible (full_name / username), si existe. */
  name: string;
  role: AppRole;
  /** screen_keys "lt-tab:*" permitidos. Vacío = sin acceso a módulos. */
  screens: string[];
}

/** Una "pantalla" gateable: clave estable + ruta navegable. */
export interface ScreenDef {
  key: string; // p.ej. "lt-tab:mapa"
  path: string; // p.ej. "/interno/nacional"
  title: string;
  group: string; // sección visible en la UI
}

/** Catálogo de todas las pantallas gateables de este tablero. Todas viven
 *  bajo /interno/* (la pestaña "Centro de Mando Digital Interno"); /externo
 *  todavía no tiene pantallas propias (placeholder, abierto a cualquier
 *  autenticado — ver isPathAllowed). */
const SCREENS: ScreenDef[] = [
  { key: "lt-tab:nacional", path: "/interno/nacional", title: "Conversación Nacional", group: "Interno" },
  { key: "lt-tab:medios", path: "/interno/medios", title: "Conversación en Medios", group: "Interno" },
  { key: "lt-tab:social", path: "/interno/social", title: "Conversación en Redes", group: "Interno" },
  { key: "lt-tab:actores-mapa", path: "/interno/mapa-colombia", title: "Mapa de Colombia", group: "Interno" },
  { key: "lt-tab:actores-perfiles", path: "/interno/instagram", title: "Instagram", group: "Interno" },
  { key: "lt-tab:parrilla", path: "/interno/parrilla", title: "Parrilla de Contenidos", group: "Interno" },
  { key: "lt-tab:estrategia-digital", path: "/interno/estrategia-digital", title: "Estrategia Publicitaria", group: "Interno" },
];

export function allScreens(): ScreenDef[] {
  return SCREENS;
}

/** Normaliza profiles.user_role al rol de la app. Legados → 'viewer'. */
export function normalizeRole(dbRole: string | null | undefined): AppRole {
  if (dbRole === "superadmin") return "superadmin";
  if (dbRole === "admin") return "admin";
  return "viewer";
}

/** Puede editar/escribir (admin o superadmin). */
export function canEdit(role: AppRole | null | undefined): boolean {
  return role === "admin" || role === "superadmin";
}

export function isSuperadmin(role: AppRole | null | undefined): boolean {
  return role === "superadmin";
}

/** Clave de pantalla que cubre `path` (match de prefijo más largo), o null si
 *  el path no corresponde a una pantalla gateable (/, /login, /admin, etc.). */
export function screenKeyForPath(path: string): string | null {
  let best: ScreenDef | null = null;
  for (const s of SCREENS) {
    if (path === s.path || path.startsWith(s.path + "/")) {
      if (!best || s.path.length > best.path.length) best = s;
    }
  }
  return best?.key ?? null;
}

/** Ruta de una pantalla dada su clave. */
export function pathForScreenKey(key: string): string | null {
  return SCREENS.find((s) => s.key === key)?.path ?? null;
}

/**
 * ¿El usuario puede acceder a `path`?
 * - superadmin: todo.
 * - /admin/usuarios/**: solo superadmin (gestión de usuarios).
 * - /admin/** (editor de KPIs, etc.): editores (admin o superadmin).
 * - paths que no son pantalla gateable: permitido a autenticados.
 * - pantallas de módulo: solo si su clave está en `access.screens`.
 */
export function isPathAllowed(access: Pick<UserAccess, "role" | "screens">, path: string): boolean {
  if (access.role === "superadmin") return true;
  if (path === "/admin/usuarios" || path.startsWith("/admin/usuarios/")) return false;
  if (path === "/admin" || path.startsWith("/admin/")) return canEdit(access.role);
  const key = screenKeyForPath(path);
  if (!key) return true;
  return access.screens.includes(key);
}

/** ¿Tiene acceso a ESTE tablero? superadmin o al menos una pantalla lt-tab. */
export function hasAppAccess(access: Pick<UserAccess, "role" | "screens">): boolean {
  if (access.role === "superadmin") return true;
  return access.screens.some((s) => s.startsWith(SCREEN_PREFIX));
}

/** Ruta de aterrizaje tras el login: primera pantalla permitida.
 *  superadmin → /interno/nacional. Sin pantallas (y no superadmin) → null (sin acceso). */
export function firstAllowedPath(access: Pick<UserAccess, "role" | "screens">): string | null {
  if (access.role === "superadmin") return "/interno/nacional";
  for (const s of SCREENS) {
    if (access.screens.includes(s.key)) return s.path;
  }
  return null;
}
