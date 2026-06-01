import { prisma } from '@/lib/prisma';
import { requireJudge } from '@/lib/auth/session';
import { statusToLabel } from '@/lib/events';
import { JudgeListClient, type TeamItem } from './JudgeListClient';

export default async function JuezHome() {
  const session = await requireJudge();

  if (!session.eventId) {
    return (
      <main className="min-h-screen bg-ivory px-6 py-12 text-center font-body text-ink">
        <p className="text-inksoft">Tu cuenta no tiene un evento asignado.</p>
        <a href="/logout" className="mt-4 inline-block text-sm font-bold text-terra hover:text-terradeep">
          Cerrar sesión
        </a>
      </main>
    );
  }

  const [judge, event, votes] = await Promise.all([
    prisma.judge.findUnique({
      where: { id: session.id },
      select: { name: true },
    }),
    prisma.event.findUnique({
      where: { id: session.eventId },
      include: {
        categories: { select: { id: true }, orderBy: { order: 'asc' } },
        teams: { orderBy: { createdAt: 'asc' } },
      },
    }),
    prisma.vote.findMany({
      where: { judgeId: session.id, eventId: session.eventId },
      select: { teamId: true, categoryId: true, score: true },
    }),
  ]);

  if (!event) {
    return (
      <main className="min-h-screen bg-ivory px-6 py-12 text-center font-body text-ink">
        <p className="text-inksoft">El evento ya no existe.</p>
        <a href="/logout" className="mt-4 inline-block text-sm font-bold text-terra hover:text-terradeep">
          Cerrar sesión
        </a>
      </main>
    );
  }

  const totalCategorias = event.categories.length;

  // Agrupa votos por equipo y calcula media.
  const byTeam = new Map<string, { sum: number; count: number }>();
  for (const v of votes) {
    const cur = byTeam.get(v.teamId) ?? { sum: 0, count: 0 };
    cur.sum += v.score;
    cur.count += 1;
    byTeam.set(v.teamId, cur);
  }

  const equipos: TeamItem[] = event.teams.map((t) => {
    const stats = byTeam.get(t.id);
    const completo = !!stats && totalCategorias > 0 && stats.count === totalCategorias;
    return {
      id: t.id,
      nombre: t.name,
      estado: completo ? 'votado' : 'pendiente',
      calificacion: completo ? stats!.sum / stats!.count : null,
    };
  });

  return (
    <JudgeListClient
      judgeName={judge?.name ?? 'Juez'}
      eventName={event.name}
      estado={statusToLabel(event.status)}
      equipos={equipos}
      totalCategorias={totalCategorias}
    />
  );
}
