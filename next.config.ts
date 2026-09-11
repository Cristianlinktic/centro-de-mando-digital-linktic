import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseWsUrl = supabaseUrl.replace(/^https:/, "wss:");

// Sin nonces a propósito: la alternativa (proxy.ts generando un nonce por
// request) obliga a renderizado dinámico en TODAS las páginas — desactiva
// static optimization/ISR/PPR en toda la app. 'unsafe-inline' es el patrón
// "sin nonces" que la propia documentación de Next.js recomienda, y es
// necesario aquí: Next.js inyecta su propio script inline de hidratación
// (confirmado: `<script id="_R_">` sin src en el HTML servido) y la app usa
// bastante `style={{...}}` inline de React.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://challenges.cloudflare.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://flagcdn.com https://unpkg.com https://images.weserv.nl ${supabaseUrl};
  font-src 'self';
  connect-src 'self' ${supabaseUrl} ${supabaseWsUrl} https://restcountries.com https://challenges.cloudflare.com;
  frame-src https://challenges.cloudflare.com https://*.challenges.cloudflare.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  // Deja de anunciar "X-Powered-By: Next.js" en cada respuesta.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Content-Security-Policy", value: cspHeader },
        ],
      },
    ];
  },
};

export default nextConfig;
