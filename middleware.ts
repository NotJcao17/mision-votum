import { NextResponse, type NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth/jwt';

// Nombre de la cookie (debe coincidir con SESSION_COOKIE en lib/auth/session.ts).
const SESSION_COOKIE = 'mv_session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  const isAdminArea = pathname.startsWith('/admin');
  const isJudgeArea = pathname.startsWith('/juez');
  const isLogin = pathname === '/login';

  // Sin sesión válida en un área protegida → al login.
  if (!session && (isAdminArea || isJudgeArea)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session) {
    // Rol incorrecto para el área → redirige a su propia área.
    if (isAdminArea && session.role !== 'admin') {
      return NextResponse.redirect(new URL('/juez', request.url));
    }
    if (isJudgeArea && session.role !== 'judge') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    // Con sesión válida visitando /login → a su área.
    if (isLogin) {
      const target = session.role === 'admin' ? '/admin' : '/juez';
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/juez/:path*', '/login'],
};
