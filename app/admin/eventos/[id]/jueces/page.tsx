import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { AdminHeader } from '@/components/ui/AdminHeader';
import { statusToLabel } from '@/lib/events';
import { JudgesManagerClient, type JudgeVM } from './JudgesManagerClient';

export default async function JudgesManagerPage({
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
        include: { _count: { select: { votes: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!event) notFound();

  // Nunca pasamos la contraseña descifrada al cliente: el ojo la pide
  // bajo demanda vía server action.
  const jueces: JudgeVM[] = event.judges.map((j) => ({
    id: j.id,
    nombre: j.name,
    username: j.username,
    email: j.email,
    votos: j._count.votes,
  }));

  return (
    <div className="min-h-screen bg-ivory font-body text-ink">
      <AdminHeader subtitle="Gestión de jueces" />
      <JudgesManagerClient
        eventId={event.id}
        eventName={event.name}
        estado={statusToLabel(event.status)}
        jueces={jueces}
      />
    </div>
  );
}
