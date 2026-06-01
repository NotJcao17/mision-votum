import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { AdminHeader } from '@/components/ui/AdminHeader';
import { statusToLabel } from '@/lib/events';
import { EventConfigClient } from './EventConfigClient';

export default async function EventConfigPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      _count: { select: { votes: true } },
      categories: { orderBy: { order: 'asc' } },
    },
  });

  if (!event) notFound();

  return (
    <div className="min-h-screen bg-ivory font-body text-ink">
      <AdminHeader subtitle="Configuración de evento" />
      <EventConfigClient
        evento={{
          id: event.id,
          nombre: event.name,
          descripcion: event.description ?? '',
          fecha: event.eventDate ? event.eventDate.toISOString().slice(0, 10) : '',
          minScore: event.minScore,
          maxScore: event.maxScore,
          estado: statusToLabel(event.status),
          votos: event._count.votes,
          categorias: event.categories.map((c) => ({ id: c.id, nombre: c.name })),
        }}
      />
    </div>
  );
}
