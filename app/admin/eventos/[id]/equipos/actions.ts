'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/session';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface ImportResult extends ActionResult {
  imported?: number;
}

function norm(name: string): string {
  return name.trim().toLowerCase();
}

async function getEventStatus(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId },
    select: { status: true },
  });
}

function revalidate(eventId: string) {
  revalidatePath('/admin');
  revalidatePath(`/admin/eventos/${eventId}`);
  revalidatePath(`/admin/eventos/${eventId}/equipos`);
}

export async function createTeam(
  eventId: string,
  name: string,
): Promise<ActionResult> {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: 'El nombre del equipo no puede estar vacío.' };
  }

  try {
    const event = await getEventStatus(eventId);
    if (!event) return { ok: false, error: 'Evento no encontrado.' };
    if (event.status === 'CLOSED') {
      return {
        ok: false,
        error: 'No se pueden añadir equipos en un evento cerrado.',
      };
    }

    const existing = await prisma.team.findMany({
      where: { eventId },
      select: { name: true },
    });
    if (existing.some((t) => norm(t.name) === norm(trimmed))) {
      return { ok: false, error: 'Ya existe un equipo con ese nombre.' };
    }

    await prisma.team.create({ data: { eventId, name: trimmed } });
    revalidate(eventId);
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo crear el equipo.' };
  }
}

export async function updateTeam(
  id: string,
  name: string,
): Promise<ActionResult> {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: 'El nombre del equipo no puede estar vacío.' };
  }

  try {
    const team = await prisma.team.findUnique({
      where: { id },
      select: { eventId: true, event: { select: { status: true } } },
    });
    if (!team) return { ok: false, error: 'Equipo no encontrado.' };
    if (team.event.status === 'CLOSED') {
      return {
        ok: false,
        error: 'No se pueden modificar equipos en un evento cerrado.',
      };
    }

    const siblings = await prisma.team.findMany({
      where: { eventId: team.eventId, NOT: { id } },
      select: { name: true },
    });
    if (siblings.some((t) => norm(t.name) === norm(trimmed))) {
      return { ok: false, error: 'Ya existe otro equipo con ese nombre.' };
    }

    await prisma.team.update({ where: { id }, data: { name: trimmed } });
    revalidate(team.eventId);
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo actualizar el equipo.' };
  }
}

export async function deleteTeam(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const team = await prisma.team.findUnique({
      where: { id },
      select: { eventId: true, event: { select: { status: true } } },
    });
    if (!team) return { ok: false, error: 'Equipo no encontrado.' };
    if (team.event.status === 'CLOSED') {
      return {
        ok: false,
        error: 'No se pueden eliminar equipos en un evento cerrado.',
      };
    }

    await prisma.team.delete({ where: { id } });
    revalidate(team.eventId);
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo eliminar el equipo.' };
  }
}

export async function importTeams(
  eventId: string,
  names: string[],
): Promise<ImportResult> {
  await requireAdmin();
  try {
    const event = await getEventStatus(eventId);
    if (!event) return { ok: false, error: 'Evento no encontrado.' };
    if (event.status === 'CLOSED') {
      return {
        ok: false,
        error: 'No se pueden importar equipos en un evento cerrado.',
      };
    }

    const existing = await prisma.team.findMany({
      where: { eventId },
      select: { name: true },
    });
    const existingSet = new Set(existing.map((t) => norm(t.name)));

    // Filtrado defensivo: trim, no vacíos, sin duplicados entre sí ni con existentes.
    const seen = new Set<string>();
    const valid: string[] = [];
    for (const raw of names) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const key = norm(trimmed);
      if (existingSet.has(key) || seen.has(key)) continue;
      seen.add(key);
      valid.push(trimmed);
    }

    if (valid.length === 0) {
      return { ok: true, imported: 0 };
    }

    await prisma.team.createMany({
      data: valid.map((name) => ({ eventId, name })),
    });
    revalidate(eventId);
    return { ok: true, imported: valid.length };
  } catch {
    return { ok: false, error: 'No se pudieron importar los equipos.' };
  }
}
