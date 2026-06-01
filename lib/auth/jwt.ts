import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

// Sesión firmada con jose (HS256). Compatible con Edge (middleware) y Node.

export type Role = 'admin' | 'judge';

export interface SessionPayload {
  role: Role;
  id: string;
  eventId?: string; // solo para jueces
}

const ISSUER = 'mision-votum';
const EXPIRATION = '7d';

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no está definida en el entorno.');
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setExpirationTime(EXPIRATION)
    .sign(getSecret());
}

export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
    });
    return toSessionPayload(payload);
  } catch {
    return null;
  }
}

function toSessionPayload(payload: JWTPayload): SessionPayload | null {
  const { role, id, eventId } = payload as Record<string, unknown>;
  if ((role !== 'admin' && role !== 'judge') || typeof id !== 'string') {
    return null;
  }
  return {
    role,
    id,
    eventId: typeof eventId === 'string' ? eventId : undefined,
  };
}
