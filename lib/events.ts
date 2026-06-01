import type { EventStatus } from '@prisma/client';
import type { EstadoEvento } from '@/components/ui/StatusBadge';

// Mapeo entre el enum de Prisma (inglés) y las etiquetas en español de la UI.
const STATUS_TO_LABEL: Record<EventStatus, EstadoEvento> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activo',
  CLOSED: 'Cerrado',
};

const LABEL_TO_STATUS: Record<EstadoEvento, EventStatus> = {
  Borrador: 'DRAFT',
  Activo: 'ACTIVE',
  Cerrado: 'CLOSED',
};

export function statusToLabel(status: EventStatus): EstadoEvento {
  return STATUS_TO_LABEL[status];
}

export function labelToStatus(label: EstadoEvento): EventStatus {
  return LABEL_TO_STATUS[label];
}

// Orden de presentación del dashboard: Activo → Borrador → Cerrado (diseño 4.1).
const ORDER: Record<EventStatus, number> = {
  ACTIVE: 0,
  DRAFT: 1,
  CLOSED: 2,
};

export function sortEvents<T extends { status: EventStatus; createdAt: Date | string }>(
  events: T[],
): T[] {
  return [...events].sort((a, b) => {
    const byStatus = ORDER[a.status] - ORDER[b.status];
    if (byStatus !== 0) return byStatus;
    // Dentro del mismo estado, los más recientes primero.
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

// Progreso global de votación: votos recibidos / votos esperados.
// Esperados = jueces × equipos × categorías. Guarda contra división por cero.
export function computeProgress({
  votes,
  judges,
  teams,
  categories,
}: {
  votes: number;
  judges: number;
  teams: number;
  categories: number;
}): number {
  const expected = judges * teams * categories;
  if (expected === 0) return 0;
  return Math.round((votes / expected) * 100);
}
