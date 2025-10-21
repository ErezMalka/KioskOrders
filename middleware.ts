import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // רשימת דפים שלא דורשים הזדהות
  const publicPaths = ['/login', '/signup', '/reset-password']
  
  // בדיקה אם הדף הנוכחי הוא ציבורי
  const isPublicPath = publicPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  )

  // קבלת הסשן הנוכחי
  const { data: { session } } = await supabase.auth.getSession()

  // אם המשתמש לא מחובר ומנסה לגשת לדף מוגן
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // אם המשתמש מחובר ומנסה לגשת לדף התחברות
  if (session && isPublicPath) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

// הגדרת הדפים שעליהם יפעל ה-Middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
