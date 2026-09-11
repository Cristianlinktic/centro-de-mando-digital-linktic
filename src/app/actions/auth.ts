"use server";

import { getAuthenticatedSupabaseClient } from "@/lib/supabase-server";
import { getServerAccess } from "@/lib/auth/access";
import { firstAllowedPath } from "@/lib/auth/rbac";
import { getClientIp, recordLoginAttempt, resetLoginAttempts } from "@/lib/auth/rate-limit";
import { redirect } from "next/navigation";

export type AuthState = {
  error: string | null;
  success?: boolean;
};

// Verificación propia (NO la protección nativa de Supabase): esa es global al
// proyecto Supabase y afecta a cualquier otra app que use el mismo Auth. Al
// validar aquí contra la API de Cloudflare directamente, el captcha queda
// aislado a este login — no hay ningún toggle que tocar en Supabase.
async function isTurnstileValid(token: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // Captcha no configurado; no bloquear el login.
  if (!token) return false;

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });
  const data = await res.json();
  return data.success === true;
}

export async function signUp(formData: FormData): Promise<AuthState> {
  const ip = await getClientIp();
  if (await recordLoginAttempt(ip)) {
    console.warn(`[auth] rate limit: signup bloqueado (ip=${ip})`);
    return { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." };
  }

  const turnstileToken = formData.get("cf-turnstile-response") as string | null;
  if (!(await isTurnstileValid(turnstileToken))) {
    console.warn(`[auth] captcha inválido: signup bloqueado (ip=${ip})`);
    return { error: "No se pudo verificar la solicitud." };
  }

  const username = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await getAuthenticatedSupabaseClient();

  const ghostEmail = username.includes("@") ? username : `${username}@yopmail.com`;

  const { error } = await supabase.auth.signUp({
    email: ghostEmail,
    password,
    options: {
      data: {
        username: username.split("@")[0],
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  await resetLoginAttempts(ip);

  return { error: null, success: true };
}

export async function signIn(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const ip = await getClientIp();
  if (await recordLoginAttempt(ip)) {
    console.warn(`[auth] rate limit: login bloqueado (ip=${ip})`);
    return { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." };
  }

  const username = formData.get("email") as string;
  const password = formData.get("password") as string;
  const turnstileToken = formData.get("cf-turnstile-response") as string | null;

  if (!(await isTurnstileValid(turnstileToken))) {
    console.warn(`[auth] captcha inválido: login bloqueado (ip=${ip}, usuario="${username}")`);
    return { error: "Credenciales de acceso incorrectas" };
  }

  const supabase = await getAuthenticatedSupabaseClient();

  const ghostEmail = username.includes("@") ? username : `${username}@yopmail.com`;

  const { error } = await supabase.auth.signInWithPassword({
    email: ghostEmail,
    password,
  });

  if (error) {
    return { error: "Credenciales de acceso incorrectas" };
  }

  await resetLoginAttempts(ip);

  // Redirige directo al destino final (no a "/" para que el proxy redirija
  // de nuevo): encadenar dos redirects — uno desde un Server Action y otro
  // desde el middleware — deja la URL del navegador pegada en el primer
  // salto aunque el contenido final sí cargue bien.
  const access = await getServerAccess();
  const landing = access ? firstAllowedPath(access) : null;
  redirect(landing ?? "/sin-acceso");
}

export async function signOut() {
  const supabase = await getAuthenticatedSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
