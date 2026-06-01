import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { AdminHeader } from '@/components/ui/AdminHeader';
import { statusToLabel } from '@/lib/events';
import { TeamsManagerClient, type TeamVM } from './TeamsManagerClient';

export default async function TeamsManagerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      teams: {
        include: { _count: { select: { votes: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!event) notFound();

  const teams: TeamVM[] = event.teams.map((t) => ({
    id: t.id,
    nombre: t.name,
    votos: t._count.votes,
  }));

  return (
    <div className="min-h-screen bg-ivory font-body text-ink">
      <AdminHeader subtitle="Gestión de equipos" />
      <TeamsManagerClient
        eventId={event.id}
        eventName={event.name}
        estado={statusToLabel(event.status)}
        equipos={teams}
      />
    </div>
  );
}
