import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { AdminHeader } from '@/components/ui/AdminHeader';
import { statusToLabel } from '@/lib/events';
import { computeCategoryRankings } from '@/lib/results';
import { ResultsClient } from './ResultsClient';

export default async function EventResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      categories: { orderBy: { order: 'asc' } },
      teams: { orderBy: { createdAt: 'asc' } },
      _count: { select: { judges: true } },
      votes: { select: { teamId: true, categoryId: true, score: true } },
    },
  });

  if (!event) notFound();

  const estado = statusToLabel(event.status);

  if (estado === 'Borrador') {
    return (
      <div className="min-h-screen bg-ivory font-body text-ink">
        <AdminHeader subtitle="Resultados" />
        <main className="mx-auto max-w-3xl px-6 py-16 lg:px-10">
          <div className="rounded-2xl border border-dashed border-ink/20 bg-cream/30 px-6 py-16 text-center">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
              El evento aún no ha iniciado
            </h1>
            <p className="mt-2 text-[15px] text-inksoft">
              Los resultados aparecen cuando el evento pasa a Activo.
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

  const rankings = computeCategoryRankings(
    event.votes,
    event.teams.map((t) => ({ id: t.id, name: t.name })),
    event.categories.map((c) => ({ id: c.id, name: c.name })),
  );

  return (
    <div className="min-h-screen bg-ivory font-body text-ink">
      <AdminHeader subtitle="Resultados" />
      <ResultsClient
        eventId={event.id}
        eventName={event.name}
        estado={estado}
        totalJudges={event._count.judges}
        rankings={rankings}
      />
    </div>
  );
}
