'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { EventStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/session';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

// Crea un evento en borrador y lleva a su pantalla de configuración.
export async function createEvent(): Promise<never> {
  await requireAdmin();
  const event = await prisma.event.create({
    data: { name: 'Nuevo evento', minScore: 1, maxScore: 5 },
  });
  revalidatePath('/admin');
  redirect(`/admin/eventos/${event.id}`);
}

export interface UpdateEventInput {
  name: string;
  eventDate: string | null; // YYYY-MM-DD o null
  description: string | null;
  minScore: number;
  maxScore: number;
}

export async function updateEvent(
  id: string,
  input: UpdateEventInput,
): Promise<ActionResult> {
  await requireAdmin();

  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: 'El nombre del evento no puede estar vacío.' };
  }
  if (!Number.isInteger(input.minScore) || !Number.isInteger(input.maxScore)) {
    return { ok: false, error: 'El rango de calificación debe ser numérico.' };
  }
  if (input.minScore >= input.maxScore) {
    return {
      ok: false,
      error: 'El mínimo del rango debe ser menor que el máximo.',
    };
  }

  try {
    await prisma.event.update({
      where: { id },
      data: {
        name,
        description: input.description?.trim() || null,
        eventDate: input.eventDate ? new Date(input.eventDate) : null,
        minScore: input.minScore,
        maxScore: input.maxScore,
      },
    });
    revalidatePath('/admin');
    revalidatePath(`/admin/eventos/${id}`);
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo guardar. Revisa tu conexión.' };
  }
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await prisma.event.delete({ where: { id } });
    revalidatePath('/admin');
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo eliminar el evento.' };
  }
}

export async function setEventStatus(
  id: string,
  next: EventStatus,
): Promise<ActionResult> {
  await requireAdmin();
  try {
    // Devolver a borrador elimina todos los votos del evento (sección 5.1).
    if (next === 'DRAFT') {
      await prisma.vote.deleteMany({ where: { eventId: id } });
    }
    await prisma.event.update({ where: { id }, data: { status: next } });
    revalidatePath('/admin');
    revalidatePath(`/admin/eventos/${id}`);
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo cambiar el estado del evento.' };
  }
}
