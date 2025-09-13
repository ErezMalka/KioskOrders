// middleware.ts - בשורש הפרויקט
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // רשימת נתיבים ציבוריים שלא דורשים אימות
  const publicPaths = ['/', '/login', '/auth/callback', '/api/health'];
  const isPublicPath = publicPaths.some(path => req.nextUrl.pathname === path);

  // בדיקה אם יש cookie של Supabase
  const supabaseCookies = req.cookies.getAll().filter(cookie => 
    cookie.name.includes('supabase') || 
    cookie.name.includes('sb-')
  );
  
  const hasSession = supabaseCookies.length > 0;

  console.log('Middleware check:', {
    path: req.nextUrl.pathname,
    hasSession,
    cookies: supabaseCookies.length
  });

  // אם אין סשן ומנסים לגשת לנתיב מוגן
  if (!hasSession && !isPublicPath) {
    console.log('No session, redirecting to login');
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  // אם יש סשן ומנסים לגשת ל-login
  if (hasSession && req.nextUrl.pathname === '/login') {
    console.log('Has session, redirecting to dashboard');
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
