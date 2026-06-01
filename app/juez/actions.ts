'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireJudge } from '@/lib/auth/session';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export type ScoresMap = Record<string, number>;

export async function submitVote(
  teamId: string,
  scores: ScoresMap,
): Promise<ActionResult> {
  const session = await requireJudge();
  const judgeId = session.id;
  const eventId = session.eventId;
  if (!eventId) {
    return { ok: false, error: 'La sesión no tiene un evento asignado.' };
  }

  try {
    const [event, team] = await Promise.all([
      prisma.event.findUnique({
        where: { id: eventId },
        include: { categories: { select: { id: true } } },
      }),
      prisma.team.findUnique({
        where: { id: teamId },
        select: { id: true, eventId: true },
      }),
    ]);

    if (!event) return { ok: false, error: 'Evento no encontrado.' };
    if (event.status !== 'ACTIVE') {
      return { ok: false, error: 'La votación no está activa en este momento.' };
    }
    if (!team || team.eventId !== eventId) {
      return { ok: false, error: 'Equipo no encontrado.' };
    }

    const expectedCats = new Set(event.categories.map((c) => c.id));
    const receivedCats = new Set(Object.keys(scores));

    // Mismo conteo y mismas claves (defensa contra manipulación cliente).
    if (
      expectedCats.size !== receivedCats.size ||
      [...expectedCats].some((id) => !receivedCats.has(id))
    ) {
      return {
        ok: false,
        error: 'Debes calificar todas las categorías antes de enviar.',
      };
    }

    for (const id of expectedCats) {
      const value = scores[id];
      if (
        !Number.isInteger(value) ||
        value < event.minScore ||
        value > event.maxScore
      ) {
        return {
          ok: false,
          error: 'Una de las calificaciones está fuera del rango permitido.',
        };
      }
    }

    await prisma.$transaction(
      [...expectedCats].map((categoryId) =>
        prisma.vote.upsert({
          where: {
            judgeId_teamId_categoryId: { judgeId, teamId, categoryId },
          },
          create: {
            eventId,
            judgeId,
            teamId,
            categoryId,
            score: scores[categoryId]!,
          },
          update: { score: scores[categoryId]! },
        }),
      ),
    );

    revalidatePath('/juez');
    revalidatePath(`/juez/equipos/${teamId}`);
    revalidatePath(`/admin/eventos/${eventId}`);
    revalidatePath(`/admin/eventos/${eventId}/equipos`);
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo registrar el voto.' };
  }
}
