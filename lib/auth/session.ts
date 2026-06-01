import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  signSession,
  verifySession,
  type SessionPayload,
} from './jwt';

export const SESSION_COOKIE = 'mv_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 días en segundos

// Lee y verifica la cookie de sesión. Devuelve el payload o null.
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

// Emite la cookie httpOnly con la sesión firmada.
export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

// Helpers para páginas/layouts de servidor: garantizan el rol o redirigen.
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    redirect('/login');
  }
  return session;
}

export async function requireJudge(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || session.role !== 'judge') {
    redirect('/login');
  }
  return session;
}
