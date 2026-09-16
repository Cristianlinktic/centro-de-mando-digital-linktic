"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { normalizeRole, SCREEN_PREFIX, type AppRole } from "@/lib/auth/rbac";

type Role = AppRole | null;

interface AuthContextType {
  user: any;
  role: Role;
  firstName: string;
  /** Nombre completo (profiles.full_name, sin recortar al primer nombre). */
  fullName: string;
  /** Cargo del usuario en la organización (profiles.job_title), o null si no tiene. */
  jobTitle: string | null;
  /** URL pública de la foto de perfil (profiles.avatar_url), o null si no tiene. */
  avatarUrl: string | null;
  /** screen_keys "lt-tab:*" permitidos para el usuario actual. */
  screens: string[];
  /** Re-lee sesión, perfil y pantallas (lo usa AccessSync ante cambios). */
  refresh: () => void;
  /** Actualiza el avatar en el estado local sin re-consultar todo (tras subir uno nuevo). */
  setAvatarUrl: (url: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  firstName: "",
  fullName: "",
  jobTitle: null,
  avatarUrl: null,
  screens: [],
  refresh: () => {},
  setAvatarUrl: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<Role>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [screens, setScreens] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Prioriza el nombre guardado en profiles.full_name; si no, metadata o email
  // (sin el dominio, si toca caer hasta ahí).
  const resolveFullName = (u: any, profile?: any) => {
    const source =
      profile?.full_name ||
      u?.user_metadata?.full_name ||
      u?.user_metadata?.name ||
      u?.user_metadata?.username ||
      u?.email ||
      "";
    return source.split("@")[0].trim();
  };
  const firstWord = (full: string) => full.split(/\s+/)[0] || "";

  const loadFor = useCallback(async (sessionUser: any | null) => {
    if (!sessionUser) {
      setUser(null);
      setRole(null);
      setFirstName("");
      setFullName("");
      setJobTitle(null);
      setAvatarUrl(null);
      setScreens([]);
      return;
    }
    setUser(sessionUser);
    const [{ data: profile }, { data: rows }] = await Promise.all([
      supabase.from("profiles").select("user_role, full_name, avatar_url, job_title").eq("id", sessionUser.id).single(),
      supabase
        .from("user_screen_access")
        .select("screen_key")
        .eq("user_id", sessionUser.id)
        .like("screen_key", `${SCREEN_PREFIX}%`),
    ]);
    setRole(normalizeRole(profile?.user_role));
    const full = resolveFullName(sessionUser, profile);
    setFullName(full);
    setFirstName(firstWord(full));
    setJobTitle(profile?.job_title ?? null);
    setAvatarUrl(profile?.avatar_url ?? null);
    setScreens((rows ?? []).map((r: { screen_key: string }) => r.screen_key));
  }, []);

  // Refresh token inválido/caducado (p.ej. cookie vieja de otra instancia de
  // Supabase): tratamos como sin sesión y limpiamos el estado local.
  const safeGetSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch {
      await supabase.auth.signOut();
      return null;
    }
  }, []);

  const refresh = useCallback(async () => {
    const session = await safeGetSession();
    await loadFor(session?.user ?? null);
  }, [loadFor, safeGetSession]);

  useEffect(() => {
    const init = async () => {
      const session = await safeGetSession();
      await loadFor(session?.user ?? null);
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      await loadFor(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadFor, safeGetSession]);

  return (
    <AuthContext.Provider value={{ user, role, firstName, fullName, jobTitle, avatarUrl, screens, refresh, setAvatarUrl }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
