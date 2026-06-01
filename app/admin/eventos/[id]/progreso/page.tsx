import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { AdminHeader } from '@/components/ui/AdminHeader';
import { statusToLabel } from '@/lib/events';
import {
  ProgressClient,
  type JudgeProgressVM,
  type ProgressSummary,
} from './ProgressClient';

export default async function EventProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      judges: {
        select: { id: true, name: true, username: true },
        orderBy: { createdAt: 'asc' },
      },
      _count: { select: { teams: true, categories: true } },
    },
  });

  if (!event) notFound();

  const estado = statusToLabel(event.status);

  if (estado === 'Borrador') {
    return (
      <div className="min-h-screen bg-ivory font-body text-ink">
        <AdminHeader subtitle="Dashboard de progreso" />
        <main className="mx-auto max-w-3xl px-6 py-16 lg:px-10">
          <div className="rounded-2xl border border-dashed border-ink/20 bg-cream/30 px-6 py-16 text-center">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
              El evento aún no ha iniciado
            </h1>
            <p className="mt-2 text-[15px] text-inksoft">
              El dashboard de progreso se habilita cuando el evento pase a Activo.
            </p>
            <a
              href={`/admin/eventos/${id}`}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-ink/15 px-5 py-2.5 text-sm font-bold text-ink transition hover:border-terra hover:text-terra"
            >
              Volver a configuración
            </a>
          </div>
        </main>
      </div>
    );
  }

  const totalTeams = event._count.teams;
  const totalCategories = event._count.categories;
  const totalJudges = event.judges.length;

  // Conteo de votos por (judgeId, teamId) y total por juez.
  const groupedByJudgeTeam = await prisma.vote.groupBy({
    by: ['judgeId', 'teamId'],
    where: { eventId: id },
    _count: { categoryId: true },
  });

  const completedByJudge = new Map<string, number>();
  const totalVotesByJudge = new Map<string, number>();
  for (const row of groupedByJudgeTeam) {
    const count = row._count.categoryId;
    totalVotesByJudge.set(
      row.judgeId,
      (totalVotesByJudge.get(row.judgeId) ?? 0) + count,
    );
    if (totalCategories > 0 && count === totalCategories) {
      completedByJudge.set(
        row.judgeId,
        (completedByJudge.get(row.judgeId) ?? 0) + 1,
      );
    }
  }

  const jueces: JudgeProgressVM[] = event.judges.map((j) => ({
    id: j.id,
    nombre: j.name,
    username: j.username,
    completedTeams: completedByJudge.get(j.id) ?? 0,
    totalVotes: totalVotesByJudge.get(j.id) ?? 0,
  }));

  const sumCompleted = jueces.reduce((s, j) => s + j.completedTeams, 0);
  const denom = totalJudges * totalTeams;
  const pctGlobal = denom === 0 ? 0 : Math.round((sumCompleted / denom) * 100);
  const completos = jueces.filter(
    (j) => totalTeams > 0 && j.completedTeams === totalTeams,
  ).length;
  const sinVotos = jueces.filter((j) => j.totalVotes === 0).length;

  const summary: ProgressSummary = {
    totalTeams,
    totalCategories,
    totalJudges,
    sumCompleted,
    pctGlobal,
    completos,
    sinVotos,
    updatedAtIso: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-ivory font-body text-ink">
      <AdminHeader subtitle="Dashboard de progreso" />
      <ProgressClient
        eventId={event.id}
        eventName={event.name}
        estado={estado}
        jueces={jueces}
        summary={summary}
      />
    </div>
  );
}
