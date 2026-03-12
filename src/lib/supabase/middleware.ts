import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ROLE_ROUTES } from '@/lib/types/auth'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRITICAL: Do not add any code between createServerClient and getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Unauthenticated: send to login (except login page itself)
  if (!user && path !== '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Authenticated on login page: redirect to role dashboard
  if (user && path === '/login') {
    const role = user.app_metadata?.role as string | undefined
    const dest = (role && ROLE_ROUTES[role as keyof typeof ROLE_ROUTES]) ?? '/property'
    const url = request.nextUrl.clone()
    url.pathname = dest
    return NextResponse.redirect(url)
  }

  // Authenticated: enforce role route access
  if (user) {
    const role = user.app_metadata?.role as string | undefined
    const ownRoute = role ? ROLE_ROUTES[role as keyof typeof ROLE_ROUTES] : undefined
    const isRoleRoute = Object.values(ROLE_ROUTES).some((r) => path.startsWith(r))

    if (isRoleRoute && ownRoute && !path.startsWith(ownRoute)) {
      const url = request.nextUrl.clone()
      url.pathname = ownRoute
      return NextResponse.redirect(url)
    }

    // Root redirect
    if (path === '/' && ownRoute) {
      const url = request.nextUrl.clone()
      url.pathname = ownRoute
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
