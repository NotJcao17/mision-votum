import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

// ─── bcrypt (contraseña del admin, hash no reversible) ───────────────

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ─── AES-256-GCM (contraseñas de jueces, cifrado reversible) ─────────
// La clave maestra vive en ENCRYPTION_KEY (32 bytes en base64).

const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('ENCRYPTION_KEY no está definida en el entorno.');
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY debe ser de 32 bytes (256 bits); recibidos ${key.length}.`,
    );
  }
  return key;
}

export interface EncryptedPassword {
  encrypted: string; // base64
  iv: string; // base64
  authTag: string; // base64
}

export function encryptPassword(plain: string): EncryptedPassword {
  const iv = crypto.randomBytes(12); // 96 bits, recomendado para GCM
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

export function decryptPassword(data: EncryptedPassword): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(data.iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(data.authTag, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data.encrypted, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

// ─── Generación de contraseñas legibles (se usa en Fase 5) ───────────
// Evita caracteres ambiguos: 0/O, 1/l/I, etc.

const READABLE_CHARS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateReadablePassword(length = 8): string {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += READABLE_CHARS[bytes[i] % READABLE_CHARS.length];
  }
  return out;
}
