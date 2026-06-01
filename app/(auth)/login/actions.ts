'use server';

import { prisma } from '@/lib/prisma';
import { verifyPassword, decryptPassword } from '@/lib/auth/crypto';
import { setSessionCookie } from '@/lib/auth/session';
import { type Role } from '@/lib/auth/jwt';

export interface LoginResult {
  ok: boolean;
  role?: Role;
  error?: string;
}

const GENERIC_ERROR = 'Usuario o contraseña incorrectos.';

export async function loginAction(
  username: string,
  password: string,
): Promise<LoginResult> {
  const user = username.trim();
  if (!user || !password) {
    return { ok: false, error: 'Ingresa tu usuario y contraseña.' };
  }

  try {
    // 1) Intentar como admin (bcrypt).
    const admin = await prisma.admin.findUnique({ where: { username: user } });
    if (admin) {
      const valid = await verifyPassword(password, admin.passwordHash);
      if (!valid) return { ok: false, error: GENERIC_ERROR };
      await setSessionCookie({ role: 'admin', id: admin.id });
      return { ok: true, role: 'admin' };
    }

    // 2) Intentar como juez (AES-256-GCM reversible).
    const judge = await prisma.judge.findUnique({ where: { username: user } });
    if (judge) {
      let decrypted: string;
      try {
        decrypted = decryptPassword({
          encrypted: judge.passwordEncrypted,
          iv: judge.passwordIv,
          authTag: judge.passwordAuthTag,
        });
      } catch {
        return { ok: false, error: GENERIC_ERROR };
      }
      if (decrypted !== password) return { ok: false, error: GENERIC_ERROR };
      await setSessionCookie({
        role: 'judge',
        id: judge.id,
        eventId: judge.eventId,
      });
      return { ok: true, role: 'judge' };
    }

    // 3) Usuario inexistente: mismo mensaje genérico (no revela existencia).
    return { ok: false, error: GENERIC_ERROR };
  } catch {
    return {
      ok: false,
      error: 'No se pudo conectar. Revisa tu conexión e intenta de nuevo.',
    };
  }
}
