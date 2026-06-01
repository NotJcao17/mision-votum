'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge, type EstadoEvento } from '@/components/ui/StatusBadge';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { Toast, useToast } from '@/components/ui/Toast';
import {
  BackIcon,
  ChevronDownIcon,
  DownloadIcon,
  Spinner,
} from '@/components/ui/icons';
import type { CategoryRanking } from '@/lib/results';

const ORDINAL = ['1.°', '2.°', '3.°', '4.°', '5.°', '6.°', '7.°', '8.°', '9.°', '10.°'];

function ordinal(n: number): string {
  return ORDINAL[n] ?? `${n + 1}.°`;
}

export function ResultsClient({
  eventId,
  eventName,
  estado,
  totalJudges,
  rankings,
}: {
  eventId: string;
  eventName: string;
  estado: EstadoEvento;
  totalJudges: number;
  rankings: CategoryRanking[];
}) {
  const router = useRouter();
  const { toast, showToast } = useToast();

  // Acordeón: por defecto abre la primera categoría con al menos un equipo.
  const firstWithRows = rankings.findIndex((c) => c.rows.length > 0);
  const [openIdx, setOpenIdx] = useState(
    firstWithRows >= 0 ? firstWithRows : 0,
  );

  const isPartial = estado === 'Activo';
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/eventos/${eventId}/exportar`);
      if (!res.ok) {
        let message = 'No se pudo generar el archivo.';
        try {
          const data = (await res.json()) as { error?: string };
          if (data.error) message = data.error;
        } catch {
          // Sin cuerpo JSON, dejamos el mensaje por defecto.
        }
        showToast(message, 'info');
        return;
      }
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="?([^"]+)"?/i);
      const filename = match?.[1] ?? `${eventName}.xlsx`;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Archivo exportado');
    } catch {
      showToast('No se pudo generar el archivo.', 'info');
    } finally {
      setExporting(false);
    }
  }

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
                Resultados · {eventName}
              </h1>
            </div>
            <div className="flex flex-shrink-0 gap-2.5">
              {isPartial && <RefreshButton />}
              <button
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center gap-2 rounded-xl bg-olive px-4 py-2.5 text-sm font-bold text-ivory transition hover:bg-olive/90 disabled:cursor-wait disabled:opacity-70"
              >
                {exporting ? (
                  <Spinner className="h-[18px] w-[18px]" />
                ) : (
                  <DownloadIcon className="h-[18px] w-[18px]" />
                )}
                {exporting ? 'Exportando…' : 'Exportar a Excel'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
        {/* Banner parciales */}
        {isPartial && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-saffron/40 bg-saffron/12 px-4 py-3 text-sm">
            <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 flex-shrink-0 text-saffron" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5M12 16.5v.3" />
            </svg>
            <span className="font-medium text-ink">
              <span className="font-bold">Resultados parciales</span> — el evento sigue activo y los votos pueden cambiar.
            </span>
          </div>
        )}

        {rankings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/20 bg-cream/30 px-6 py-16 text-center text-inksoft">
            <p className="font-display text-xl font-semibold text-ink">No hay categorías</p>
            <p className="mt-1 text-sm">
              Sin categorías no se pueden calcular resultados.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {rankings.map((cat, i) => (
              <CategorySection
                key={cat.id}
                cat={cat}
                totalJudges={totalJudges}
                open={openIdx === i}
                onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
              />
            ))}
          </div>
        )}
      </main>

      <Toast toast={toast} />
    </>
  );
}

function CategorySection({
  cat,
  totalJudges,
  open,
  onToggle,
}: {
  cat: CategoryRanking;
  totalJudges: number;
  open: boolean;
  onToggle: () => void;
}) {
  const lider = cat.rows[0]?.name.split(' · ')[0] ?? null;
  const pocos = cat.rows.some((r) => totalJudges > 0 && r.votes < totalJudges);

  return (
    <section className="overflow-hidden rounded-2xl border border-ink/10 bg-cream/30">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-cream/60 lg:px-6"
      >
        <div className="flex items-center gap-3">
          <span className="font-display text-xl font-semibold tracking-tight text-ink lg:text-2xl">
            {cat.name}
          </span>
          <span className="rounded-full bg-ink/8 px-2.5 py-0.5 text-xs font-bold text-inksoft">
            {cat.rows.length} {cat.rows.length === 1 ? 'equipo' : 'equipos'}
          </span>
        </div>
        <span className="flex items-center gap-3 text-sm text-inksoft">
          {lider && (
            <span className="hidden sm:inline">
              Líder: <span className="font-bold text-ink">{lider}</span>
            </span>
          )}
          <ChevronDownIcon
            className={`h-5 w-5 flex-shrink-0 text-inkfaint transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {open && (
        <div className="border-t border-ink/10">
          {cat.rows.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-inksoft lg:px-6">
              Aún no hay votos en esta categoría.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-[56px_1fr_84px_72px] items-center gap-3 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-inkfaint lg:px-6">
                <span>Pos.</span>
                <span>Equipo</span>
                <span className="text-right">Promedio</span>
                <span className="text-right">Votos</span>
              </div>
              <ul>
                {cat.rows.map((row, i) => {
                  const first = i === 0;
                  const fewVotes = totalJudges > 0 && row.votes < totalJudges;
                  return (
                    <li
                      key={row.teamId}
                      className={`grid grid-cols-[56px_1fr_84px_72px] items-center gap-3 border-t border-ink/8 px-5 py-3 lg:px-6 ${
                        first ? 'bg-saffron/12' : ''
                      }`}
                    >
                      <span className="flex items-center">
                        {first ? (
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-saffron/25 text-base" title="Primer lugar">🥇</span>
                        ) : i === 1 ? (
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-ink/6 text-base">🥈</span>
                        ) : i === 2 ? (
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-terra/8 text-base">🥉</span>
                        ) : (
                          <span className="pl-1 font-display text-base font-semibold text-inkfaint">
                            {ordinal(i)}
                          </span>
                        )}
                      </span>
                      <span
                        className={`min-w-0 truncate text-[15px] ${
                          first ? 'font-bold text-ink' : 'font-semibold text-ink'
                        }`}
                      >
                        {row.name}
                      </span>
                      <span
                        className={`text-right font-display text-lg font-semibold ${
                          first ? 'text-terra' : 'text-ink'
                        }`}
                      >
                        {row.average.toFixed(1)}
                      </span>
                      <span className="flex items-center justify-end gap-1 text-right text-sm">
                        <span className={`font-bold ${fewVotes ? 'text-saffron' : 'text-inksoft'}`}>
                          {row.votes}
                        </span>
                        {totalJudges > 0 && (
                          <span className="text-inkfaint">/{totalJudges}</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {pocos && (
                <p className="border-t border-ink/8 bg-saffron/8 px-5 py-3 text-xs text-inksoft lg:px-6">
                  <span className="font-bold text-saffron">Nota:</span> algunos equipos tienen menos votos que otros. El promedio se calcula con los votos disponibles.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
