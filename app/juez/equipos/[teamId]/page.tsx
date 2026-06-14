import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireJudge } from '@/lib/auth/session';
import { VotingClient } from './VotingClient';

export default async function JudgeVotingPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const session = await requireJudge();
  const { teamId } = await params;

  if (!session.eventId) redirect('/juez');

  const [event, team, previousVotes] = await Promise.all([
    prisma.event.findUnique({
      where: { id: session.eventId },
      include: { categories: { orderBy: { order: 'asc' } } },
    }),
    prisma.team.findUnique({ where: { id: teamId } }),
    prisma.vote.findMany({
      where: { judgeId: session.id, teamId },
      select: { categoryId: true, score: true },
    }),
  ]);

  if (!event) redirect('/juez');
  if (!team || team.eventId !== session.eventId) notFound();
  if (event.status !== 'ACTIVE') redirect('/juez');

  const previo: Record<string, number> = {};
  for (const v of previousVotes) previo[v.categoryId] = v.score;

  return (
    <VotingClient
      teamId={team.id}
      teamName={team.name}
      minScore={event.minScore}
      maxScore={event.maxScore}
      categorias={event.categories.map((c) => ({
        id: c.id,
        nombre: c.name,
        descripcion: c.description ?? '',
      }))}
      previo={previo}
    />
  );
}
