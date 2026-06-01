import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { buildEventWorkbook, slugifyEventName } from '@/lib/excel';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      categories: { orderBy: { order: 'asc' } },
      teams: { orderBy: { createdAt: 'asc' } },
      judges: { orderBy: { createdAt: 'asc' } },
      votes: {
        select: {
          teamId: true,
          categoryId: true,
          judgeId: true,
          score: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!event) {
    return Response.json({ error: 'Evento no encontrado.' }, { status: 404 });
  }
  if (event.status === 'DRAFT') {
    return Response.json(
      { error: 'No se pueden exportar resultados en un evento en Borrador.' },
      { status: 400 },
    );
  }

  const workbook = await buildEventWorkbook({
    eventName: event.name,
    categories: event.categories.map((c) => ({ id: c.id, name: c.name })),
    teams: event.teams.map((t) => ({ id: t.id, name: t.name })),
    judges: event.judges.map((j) => ({
      id: j.id,
      name: j.name,
      username: j.username,
    })),
    votes: event.votes,
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `${slugifyEventName(event.name)}.xlsx`;

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
