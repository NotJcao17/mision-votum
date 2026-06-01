'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge, type EstadoEvento } from '@/components/ui/StatusBadge';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { BackIcon } from '@/components/ui/icons';

export interface JudgeProgressVM {
  id: string;
  nombre: string;
  username: string;
  completedTeams: number;
  totalVotes: number;
}

export interface ProgressSummary {
  totalTeams: number;
  totalCategories: number;
  totalJudges: number;
  sumCompleted: number;
  pctGlobal: number;
  completos: number;
  sinVotos: number;
  updatedAtIso: string;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0]!)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function judgeRank(j: JudgeProgressVM, totalTeams: number): number {
  if (j.totalVotes === 0) return 0;
  if (totalTeams > 0 && j.completedTeams === totalTeams) return 2;
  return 1;
}

const relativeFmt = new Intl.RelativeTimeFormat('es-MX', { numeric: 'auto' });

function formatRelative(updatedAt: Date, now: Date): string {
  const secs = Math.round((updatedAt.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(secs);
  if (abs < 5) return 'justo ahora';
  if (abs < 60) return relativeFmt.format(secs, 'second');
  if (abs < 3600) return relativeFmt.format(Math.round(secs / 60), 'minute');
  if (abs < 86400) return relativeFmt.format(Math.round(secs / 3600), 'hour');
  return relativeFmt.format(Math.round(secs / 86400), 'day');
}

export function ProgressClient({
  eventId,
  eventName,
  estado,
  jueces,
  summary,
}: {
  eventId: string;
  eventName: string;
  estado: EstadoEvento;
  jueces: JudgeProgressVM[];
  summary: ProgressSummary;
}) {
  const router = useRouter();
  const updatedAt = useMemo(() => new Date(summary.updatedAtIso), [summary.updatedAtIso]);
  const [, setTick] = useState(0);

  // Refresca el texto "Actualizado hace X" cada 30 s sin tocar la red.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const ordenados = useMemo(() => {
    const totalTeams = summary.totalTeams;
    return [...jueces].sort((a, b) => {
      const ra = judgeRank(a, totalTeams);
      const rb = judgeRank(b, totalTeams);
      if (ra !== rb) return ra - rb;
      return a.completedTeams - b.completedTeams;
    });
  }, [jueces, summary.totalTeams]);

  const updatedText = formatRelative(updatedAt, new Date());

  return (
    <>
      {/* Encabezado del evento */}
      <div className="border-b border-ink/10 bg-cream/30">
        <div className="mx-auto max-w-5xl px-6 py-6 lg:px-10">
          <button
            onClick={() => router.push(`/admin/eventos/${eventId}`)}
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-bold text-inksoft transition hover:text-terra"
          >
            <BackIcon className="h-4 w-4" />
            Volver a configuración
          </button>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <StatusBadge estado={estado} />
              <h1 className="min-w-0 truncate font-display text-3xl font-semibold leading-tight tracking-tight text-ink md:text-4xl">
                Progreso · {eventName}
              </h1>
            </div>
            <RefreshButton />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
        {/* Métrica global */}
        <section className="rounded-2xl border border-ink/10 bg-cream/30 p-6 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-12">
            <div className="lg:w-72 lg:flex-shrink-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-inksoft">
                Progreso global de votación
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-7xl font-semibold leading-none tracking-tight text-terra lg:text-8xl">
                  {summary.pctGlobal}
                </span>
                <span className="font-display text-3xl font-medium text-terra">%</span>
                <span className="ml-1 pb-1 text-sm font-bold text-inksoft">completado</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="h-4 w-full overflow-hidden rounded-full bg-ink/8">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-terra to-saffron transition-[width] duration-500"
                  style={{ width: `${summary.pctGlobal}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-inksoft">
                  <span className="font-bold text-ink">{summary.sumCompleted}</span> de{' '}
                  <span className="font-bold text-ink">
                    {summary.totalJudges * summary.totalTeams}
                  </span>{' '}
                  equipos completados
                </span>
                <span className="text-inkfaint">Actualizado {updatedText} · no automático</span>
              </div>
              <p className="mt-4 text-[15px] text-ink">
                <span className="font-bold">
                  {summary.completos} de {summary.totalJudges} jueces
                </span>{' '}
                han completado todos sus votos.
                {summary.sinVotos > 0 && (
                  <span className="text-inksoft">
                    {' '}
                    {summary.sinVotos}{' '}
                    {summary.sinVotos === 1 ? 'aún no ha' : 'aún no han'} empezado.
                  </span>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Lista de jueces */}
        <div className="mt-7 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Progreso por juez
          </h2>
          <span className="text-sm text-inkfaint">
            {summary.totalTeams} {summary.totalTeams === 1 ? 'equipo' : 'equipos'} por juez
          </span>
        </div>

        {ordenados.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-ink/20 px-6 py-12 text-center text-inksoft">
            No hay jueces registrados todavía.
          </div>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {ordenados.map((j) => {
              const pct =
                summary.totalTeams === 0
                  ? 0
                  : Math.round((j.completedTeams / summary.totalTeams) * 100);
              const completo =
                summary.totalTeams > 0 && j.completedTeams === summary.totalTeams;
              const sin = j.totalVotes === 0;
              const barColor = completo ? 'bg-olive' : sin ? 'bg-danger/40' : 'bg-terra';
              return (
                <li
                  key={j.id}
                  className="rounded-2xl border border-ink/10 bg-cream/30 px-5 py-4 transition hover:bg-cream/60"
                >
                  <div className="flex items-center gap-4">
                    <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-ivory font-body text-sm font-bold text-inksoft ring-1 ring-ink/10">
                      {initials(j.nombre)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[15px] font-bold text-ink">{j.nombre}</span>
                        {sin && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/12 px-2.5 py-0.5 text-xs font-bold text-danger">
                            <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                            Sin votos
                          </span>
                        )}
                        {completo && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-olive/12 px-2.5 py-0.5 text-xs font-bold text-olive">
                            <span className="h-1.5 w-1.5 rounded-full bg-olive" />
                            Completo
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 truncate font-mono text-xs text-inkfaint">
                        @{j.username}
                      </div>
                    </div>
                    <div className="hidden text-right sm:block">
                      <div className="font-display text-xl font-semibold text-ink">{pct}%</div>
                      <div className="text-xs text-inksoft">
                        {j.completedTeams} / {summary.totalTeams} equipos
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/8">
                      <div
                        className={`h-full rounded-full ${barColor} transition-[width] duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-28 flex-shrink-0 text-right text-xs font-bold text-inksoft sm:hidden">
                      {j.completedTeams} / {summary.totalTeams} · {pct}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
