import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';

// Cierra sesión: borra la cookie y redirige al login.
async function logout(request: Request) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL('/login', request.url));
}

export const GET = logout;
export const POST = logout;
