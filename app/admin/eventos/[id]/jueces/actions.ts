'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/session';
import {
  encryptPassword,
  decryptPassword,
  generateReadablePassword,
} from '@/lib/auth/crypto';
import {
  buildBaseUsername,
  generateUniqueUsername,
} from '@/lib/auth/usernames';
import {
  getMailTransport,
  getFromEmail,
  buildCredentialsEmail,
} from '@/lib/email';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface CreateJudgeResult extends ActionResult {
  username?: string;
  password?: string;
}

export interface RevealResult extends ActionResult {
  password?: string;
}

export interface ImportResult extends ActionResult {
  imported?: number;
}

function revalidate(eventId: string) {
  revalidatePath('/admin');
  revalidatePath(`/admin/eventos/${eventId}`);
  revalidatePath(`/admin/eventos/${eventId}/jueces`);
}

async function getEventStatus(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId },
    select: { status: true },
  });
}

async function isUsernameTaken(username: string): Promise<boolean> {
  const found = await prisma.judge.findUnique({
    where: { username },
    select: { id: true },
  });
  return found !== null;
}

function buildCipherFields(plain: string) {
  const enc = encryptPassword(plain);
  return {
    passwordEncrypted: enc.encrypted,
    passwordIv: enc.iv,
    passwordAuthTag: enc.authTag,
  };
}

export async function createJudge(
  eventId: string,
  name: string,
  email: string | null,
): Promise<CreateJudgeResult> {
  await requireAdmin();
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { ok: false, error: 'El nombre del juez no puede estar vacío.' };
  }
  const trimmedEmail = email?.trim() || null;
  if (trimmedEmail && !EMAIL_RE.test(trimmedEmail)) {
    return { ok: false, error: 'El email no tiene un formato válido.' };
  }

  try {
    const event = await getEventStatus(eventId);
    if (!event) return { ok: false, error: 'Evento no encontrado.' };
    if (event.status === 'CLOSED') {
      return {
        ok: false,
        error: 'No se pueden añadir jueces en un evento cerrado.',
      };
    }

    const base = buildBaseUsername(trimmedName);
    const username = await generateUniqueUsername(base, isUsernameTaken);
    const password = generateReadablePassword(8);

    await prisma.judge.create({
      data: {
        eventId,
        name: trimmedName,
        email: trimmedEmail,
        username,
        ...buildCipherFields(password),
      },
    });

    revalidate(eventId);
    return { ok: true, username, password };
  } catch {
    return { ok: false, error: 'No se pudo crear el juez.' };
  }
}

export async function updateJudge(
  id: string,
  name: string,
  email: string | null,
): Promise<ActionResult> {
  await requireAdmin();
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { ok: false, error: 'El nombre del juez no puede estar vacío.' };
  }
  const trimmedEmail = email?.trim() || null;
  if (trimmedEmail && !EMAIL_RE.test(trimmedEmail)) {
    return { ok: false, error: 'El email no tiene un formato válido.' };
  }

  try {
    const judge = await prisma.judge.findUnique({
      where: { id },
      select: { eventId: true, event: { select: { status: true } } },
    });
    if (!judge) return { ok: false, error: 'Juez no encontrado.' };
    if (judge.event.status === 'CLOSED') {
      return {
        ok: false,
        error: 'No se pueden modificar jueces en un evento cerrado.',
      };
    }

    await prisma.judge.update({
      where: { id },
      data: { name: trimmedName, email: trimmedEmail },
    });
    revalidate(judge.eventId);
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo actualizar el juez.' };
  }
}

export async function deleteJudge(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const judge = await prisma.judge.findUnique({
      where: { id },
      select: { eventId: true, event: { select: { status: true } } },
    });
    if (!judge) return { ok: false, error: 'Juez no encontrado.' };
    if (judge.event.status === 'CLOSED') {
      return {
        ok: false,
        error: 'No se pueden eliminar jueces en un evento cerrado.',
      };
    }
    await prisma.judge.delete({ where: { id } });
    revalidate(judge.eventId);
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo eliminar el juez.' };
  }
}

export async function regenerateJudgePassword(
  id: string,
): Promise<RevealResult> {
  await requireAdmin();
  try {
    const judge = await prisma.judge.findUnique({
      where: { id },
      select: { eventId: true, event: { select: { status: true } } },
    });
    if (!judge) return { ok: false, error: 'Juez no encontrado.' };
    if (judge.event.status === 'CLOSED') {
      return {
        ok: false,
        error: 'No se puede regenerar la contraseña en un evento cerrado.',
      };
    }

    const password = generateReadablePassword(8);
    await prisma.judge.update({
      where: { id },
      data: buildCipherFields(password),
    });
    revalidate(judge.eventId);
    return { ok: true, password };
  } catch {
    return { ok: false, error: 'No se pudo regenerar la contraseña.' };
  }
}

export async function revealJudgePassword(id: string): Promise<RevealResult> {
  await requireAdmin();
  try {
    const judge = await prisma.judge.findUnique({
      where: { id },
      select: {
        passwordEncrypted: true,
        passwordIv: true,
        passwordAuthTag: true,
      },
    });
    if (!judge) return { ok: false, error: 'Juez no encontrado.' };
    const password = decryptPassword({
      encrypted: judge.passwordEncrypted,
      iv: judge.passwordIv,
      authTag: judge.passwordAuthTag,
    });
    return { ok: true, password };
  } catch {
    return { ok: false, error: 'No se pudo descifrar la contraseña.' };
  }
}

export interface ImportEntry {
  name: string;
  email: string | null;
}

export async function importJudges(
  eventId: string,
  entries: ImportEntry[],
): Promise<ImportResult> {
  await requireAdmin();
  try {
    const event = await getEventStatus(eventId);
    if (!event) return { ok: false, error: 'Evento no encontrado.' };
    if (event.status === 'CLOSED') {
      return {
        ok: false,
        error: 'No se pueden importar jueces en un evento cerrado.',
      };
    }

    // Cache local de usernames asignados en este lote para evitar colisiones
    // dentro del propio lote.
    const localTaken = new Set<string>();
    const isTakenWithLocal = async (candidate: string) => {
      if (localTaken.has(candidate)) return true;
      return isUsernameTaken(candidate);
    };

    let imported = 0;
    for (const entry of entries) {
      const trimmedName = entry.name.trim();
      if (!trimmedName) continue;
      const trimmedEmail = entry.email?.trim() || null;
      if (trimmedEmail && !EMAIL_RE.test(trimmedEmail)) continue;

      const base = buildBaseUsername(trimmedName);
      const username = await generateUniqueUsername(base, isTakenWithLocal);
      localTaken.add(username);
      const password = generateReadablePassword(8);

      await prisma.judge.create({
        data: {
          eventId,
          name: trimmedName,
          email: trimmedEmail,
          username,
          ...buildCipherFields(password),
        },
      });
      imported += 1;
    }

    revalidate(eventId);
    return { ok: true, imported };
  } catch {
    return { ok: false, error: 'No se pudieron importar los jueces.' };
  }
}

// ─── Envío de credenciales por email (Resend) ────────────────────────

export interface SendResult extends ActionResult {
  recipient?: string;
}

export interface SendAllResult extends ActionResult {
  sent?: number;
  failed?: number;
}

async function sendCredentialsEmail(args: {
  to: string;
  judgeName: string;
  eventName: string;
  username: string;
  password: string;
}): Promise<{ ok: boolean; error?: string }> {
  const transport = getMailTransport();
  if (!transport) {
    return {
      ok: false,
      error: 'Configura SMTP_USER y SMTP_PASS en .env para poder enviar emails.',
    };
  }
  const { subject, html, text } = buildCredentialsEmail({
    judgeName: args.judgeName,
    eventName: args.eventName,
    username: args.username,
    password: args.password,
    loginUrl: process.env.APP_URL || undefined,
  });
  try {
    await transport.sendMail({
      from: getFromEmail(),
      to: args.to,
      subject,
      html,
      text,
    });
    return { ok: true };
  } catch (e) {
    console.error('[SMTP] send failed:', e);
    const msg = e instanceof Error ? e.message : 'desconocido';
    return { ok: false, error: `No se pudo enviar el correo: ${msg}` };
  }
}

export async function sendJudgeCredentials(
  judgeId: string,
): Promise<SendResult> {
  await requireAdmin();
  const judge = await prisma.judge.findUnique({
    where: { id: judgeId },
    select: {
      name: true,
      email: true,
      username: true,
      passwordEncrypted: true,
      passwordIv: true,
      passwordAuthTag: true,
      event: { select: { name: true } },
    },
  });
  if (!judge) return { ok: false, error: 'Juez no encontrado.' };
  if (!judge.email) {
    return { ok: false, error: 'Este juez no tiene email registrado.' };
  }
  let password: string;
  try {
    password = decryptPassword({
      encrypted: judge.passwordEncrypted,
      iv: judge.passwordIv,
      authTag: judge.passwordAuthTag,
    });
  } catch {
    return { ok: false, error: 'No se pudo descifrar la contraseña.' };
  }
  const res = await sendCredentialsEmail({
    to: judge.email,
    judgeName: judge.name,
    eventName: judge.event.name,
    username: judge.username,
    password,
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, recipient: judge.email };
}

export async function sendAllJudgeCredentials(
  eventId: string,
): Promise<SendAllResult> {
  await requireAdmin();
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { name: true },
  });
  if (!event) return { ok: false, error: 'Evento no encontrado.' };

  const judges = await prisma.judge.findMany({
    where: { eventId, NOT: { email: null } },
    select: {
      name: true,
      email: true,
      username: true,
      passwordEncrypted: true,
      passwordIv: true,
      passwordAuthTag: true,
    },
  });
  if (judges.length === 0) {
    return {
      ok: false,
      error: 'Ningún juez del evento tiene email registrado.',
    };
  }

  // Cortocircuito: si no hay credenciales SMTP, falla con mensaje claro.
  if (!getMailTransport()) {
    return {
      ok: false,
      error: 'Configura SMTP_USER y SMTP_PASS en .env para poder enviar emails.',
    };
  }

  const results = await Promise.allSettled(
    judges.map(async (j) => {
      const password = decryptPassword({
        encrypted: j.passwordEncrypted,
        iv: j.passwordIv,
        authTag: j.passwordAuthTag,
      });
      const r = await sendCredentialsEmail({
        to: j.email!,
        judgeName: j.name,
        eventName: event.name,
        username: j.username,
        password,
      });
      if (!r.ok) throw new Error(r.error ?? 'send failed');
    }),
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.length - sent;
  return { ok: true, sent, failed };
}
