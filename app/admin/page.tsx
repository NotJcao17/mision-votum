import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { AdminHeader } from '@/components/ui/AdminHeader';
import { sortEvents, statusToLabel, computeProgress } from '@/lib/events';
import { DashboardClient, type EventoVM } from './DashboardClient';

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  const [admin, events] = await Promise.all([
    prisma.admin.findUnique({ where: { id: session.id } }),
    prisma.event.findMany({
      include: {
        _count: { select: { categories: true, teams: true, judges: true, votes: true } },
      },
    }),
  ]);

  const eventos: EventoVM[] = sortEvents(events).map((ev) => ({
    id: ev.id,
    nombre: ev.name,
    estado: statusToLabel(ev.status),
    fecha: ev.eventDate ? ev.eventDate.toISOString() : null,
    categorias: ev._count.categories,
    equipos: ev._count.teams,
    jueces: ev._count.judges,
    votos: ev._count.votes,
    progreso: computeProgress({
      votes: ev._count.votes,
      judges: ev._count.judges,
      teams: ev._count.teams,
      categories: ev._count.categories,
    }),
  }));

  return (
    <div className="min-h-screen bg-ivory font-body text-ink">
      <AdminHeader subtitle="Panel de administración" admin={admin?.username ?? 'Administrador'} />
      <DashboardClient eventos={eventos} />
    </div>
  );
}
