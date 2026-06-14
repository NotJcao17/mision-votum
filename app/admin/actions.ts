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

// ─── Eventos ─────────────────────────────────────────────────────────

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
  eventDate: string | null;
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

  try {
    const current = await prisma.event.findUnique({
      where: { id },
      select: { status: true, minScore: true, maxScore: true },
    });
    if (!current) return { ok: false, error: 'Evento no encontrado.' };

    // En Activo/Cerrado, el rango es de solo lectura: ignora los valores entrantes.
    const isDraft = current.status === 'DRAFT';
    const minScore = isDraft ? input.minScore : current.minScore;
    const maxScore = isDraft ? input.maxScore : current.maxScore;

    if (isDraft) {
      if (!Number.isInteger(minScore) || !Number.isInteger(maxScore)) {
        return { ok: false, error: 'El rango de calificación debe ser numérico.' };
      }
      if (minScore >= maxScore) {
        return {
          ok: false,
          error: 'El mínimo del rango debe ser menor que el máximo.',
        };
      }
      if (maxScore - minScore + 1 > 20) {
        return {
          ok: false,
          error: 'El rango no puede tener más de 20 valores (ej. del 1 al 20).',
        };
      }
    }

    await prisma.event.update({
      where: { id },
      data: {
        name,
        description: input.description?.trim() || null,
        eventDate: input.eventDate ? new Date(input.eventDate) : null,
        minScore,
        maxScore,
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
    const current = await prisma.event.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!current) return { ok: false, error: 'Evento no encontrado.' };

    // Activar desde Borrador exige ≥1 categoría (sección 4.2 del diseño).
    if (next === 'ACTIVE' && current.status === 'DRAFT') {
      const count = await prisma.category.count({ where: { eventId: id } });
      if (count === 0) {
        return {
          ok: false,
          error: 'Añade al menos una categoría antes de activar el evento.',
        };
      }
    }

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

// ─── Categorías ──────────────────────────────────────────────────────

export interface CategoryVM {
  id: string;
  nombre: string;
  descripcion: string;
}

export interface AddCategoryResult extends ActionResult {
  category?: CategoryVM;
}

async function assertEventDraft(eventId: string): Promise<ActionResult | null> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { status: true },
  });
  if (!event) return { ok: false, error: 'Evento no encontrado.' };
  if (event.status !== 'DRAFT') {
    return {
      ok: false,
      error: 'Las categorías solo se pueden modificar mientras el evento está en Borrador.',
    };
  }
  return null;
}

export async function addCategory(eventId: string): Promise<AddCategoryResult> {
  await requireAdmin();
  const guard = await assertEventDraft(eventId);
  if (guard) return guard;

  try {
    const last = await prisma.category.findFirst({
      where: { eventId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = (last?.order ?? 0) + 1;
    const created = await prisma.category.create({
      data: { eventId, name: 'Nueva categoría', order: nextOrder },
    });
    revalidatePath('/admin');
    revalidatePath(`/admin/eventos/${eventId}`);
    return {
      ok: true,
      category: { id: created.id, nombre: created.name, descripcion: created.description ?? '' },
    };
  } catch {
    return { ok: false, error: 'No se pudo añadir la categoría.' };
  }
}

export async function updateCategory(
  id: string,
  name: string,
  description: string,
): Promise<ActionResult> {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: 'El nombre de la categoría no puede estar vacío.' };
  }
  const trimmedDescription = description.trim();

  try {
    const cat = await prisma.category.findUnique({
      where: { id },
      select: { eventId: true, event: { select: { status: true } } },
    });
    if (!cat) return { ok: false, error: 'Categoría no encontrada.' };
    if (cat.event.status !== 'DRAFT') {
      return {
        ok: false,
        error: 'Las categorías solo se pueden modificar mientras el evento está en Borrador.',
      };
    }
    await prisma.category.update({
      where: { id },
      data: { name: trimmed, description: trimmedDescription || null },
    });
    revalidatePath('/admin');
    revalidatePath(`/admin/eventos/${cat.eventId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo actualizar la categoría.' };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const cat = await prisma.category.findUnique({
      where: { id },
      select: { eventId: true, event: { select: { status: true } } },
    });
    if (!cat) return { ok: false, error: 'Categoría no encontrada.' };
    if (cat.event.status !== 'DRAFT') {
      return {
        ok: false,
        error: 'Las categorías solo se pueden eliminar mientras el evento está en Borrador.',
      };
    }
    await prisma.category.delete({ where: { id } });
    revalidatePath('/admin');
    revalidatePath(`/admin/eventos/${cat.eventId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo eliminar la categoría.' };
  }
}
