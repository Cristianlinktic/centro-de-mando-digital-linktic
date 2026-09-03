import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  normalizeRole,
  hasAppAccess,
  isPathAllowed,
  firstAllowedPath,
  SCREEN_PREFIX,
} from '@/lib/auth/rbac'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
      db: { schema: 'centro_mando' },
    }
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (e) {
    // Supabase inalcanzable (DNS/red transitoria): fail-open, se revalida luego.
    console.warn('Proxy: no se pudo verificar la sesión:', (e as Error)?.message)
    return response
  }

  // Las rutas /api se autoprotegen (requireSuperadmin / getServerAccess) y deben
  // devolver JSON, no redirecciones: solo refrescamos la sesión y pasamos.
  if (path.startsWith('/api')) return response

  // Sin sesión → al login (salvo que ya esté en /login).
  if (!user) {
    if (path.startsWith('/login')) return response
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Hay sesión: cargamos rol + pantallas de ESTE tablero (lt-tab:*).
  const [{ data: profile }, { data: rows }] = await Promise.all([
    supabase.from('profiles').select('user_role').eq('id', user.id).single(),
    supabase
      .from('user_screen_access')
      .select('screen_key')
      .eq('user_id', user.id)
      .like('screen_key', `${SCREEN_PREFIX}%`),
  ])
  const access = {
    role: normalizeRole(profile?.user_role),
    screens: (rows ?? []).map((r: { screen_key: string }) => r.screen_key),
  }
  const landing = firstAllowedPath(access)

  // Ya logueado visitando /login → a su pantalla (o a /sin-acceso).
  if (path.startsWith('/login')) {
    return NextResponse.redirect(new URL(landing ?? '/sin-acceso', request.url))
  }

  // No tiene acceso a este tablero → /sin-acceso.
  if (!hasAppAccess(access)) {
    if (path.startsWith('/sin-acceso')) return response
    return NextResponse.redirect(new URL('/sin-acceso', request.url))
  }

  // Tiene acceso pero está en /sin-acceso → a su pantalla.
  if (path.startsWith('/sin-acceso')) {
    return NextResponse.redirect(new URL(landing ?? '/mapa', request.url))
  }

  // Raíz → primera pantalla permitida.
  if (path === '/') {
    return NextResponse.redirect(new URL(landing ?? '/mapa', request.url))
  }

  // Gating fino por pantalla (incluye /admin solo-superadmin).
  if (!isPathAllowed(access, path)) {
    return NextResponse.redirect(new URL(landing ?? '/mapa', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
