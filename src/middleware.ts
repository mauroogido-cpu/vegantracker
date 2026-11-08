import { createServerClient, type CookieOptions } from '@supabase/ssr'
import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { defaultLocale, locales } from '@/i18n'

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Cookies set by Supabase during the session refresh, applied to
  // whichever response we end up returning.
  let cookiesToSet: { name: string; value: string; options: CookieOptions }[] = []

  // 1. Refresh the Supabase auth session and read the current user.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSetFromSdk: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSetFromSdk.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet = cookiesToSetFromSdk
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 2. Protect /app/ routes: unauthenticated users go to /${locale}/login.
  if (!user && pathname.includes('/app/')) {
    const segment = pathname.split('/')[1]
    const locale = (locales as readonly string[]).includes(segment) ? segment : defaultLocale
    const loginUrl = new URL(`/${locale}/login`, request.url)
    const redirectResponse = NextResponse.redirect(loginUrl)
    cookiesToSet.forEach(({ name, value, options }) =>
      redirectResponse.cookies.set(name, value, options)
    )
    return redirectResponse
  }

  // 3. Apply next-intl locale routing, carrying over the refreshed cookies.
  const response = intlMiddleware(request)
  cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
  return response
}

export const config = {
  // Skip API routes, Next internals, and static files.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
