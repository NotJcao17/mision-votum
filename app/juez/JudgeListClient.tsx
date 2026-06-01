'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { EstadoEvento } from '@/components/ui/StatusBadge';
import { LogoutIcon, CheckIcon } from '@/components/ui/icons';

export interface TeamItem {
  id: string;
  nombre: string;
  estado: 'pendiente' | 'votado';
  calificacion: number | null;
}

export function JudgeListClient({
  judgeName,
  eventName,
  estado,
  equipos,
  totalCategorias,
}: {
  judgeName: string;
  eventName: string;
  estado: EstadoEvento;
  equipos: TeamItem[];
  totalCategorias: number;
}) {
  const router = useRouter();
  const isActive = estado === 'Activo';

  const { pendientes, votados } = useMemo(() => {
    const p = equipos.filter((e) => e.estado === 'pendiente');
    const v = equipos.filter((e) => e.estado === 'votado');
    return { pendientes: p, votados: v };
  }, [equipos]);

  const total = equipos.length;
  const votedCount = votados.length;
  const pct = total === 0 ? 0 : Math.round((votedCount / total) * 100);

  function goToTeam(id: string) {
    if (!isActive) return;
    router.push(`/juez/equipos/${id}`);
  }

  return (
    <main className="min-h-screen bg-ivory pb-10 font-body text-ink">
      {/* Header */}
      <header className="flex items-start justify-between gap-3 px-5 pb-1 pt-6">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-terra">Misión Votum</div>
          <h1 className="mt-1 truncate font-display text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
            Hola, {judgeName.split(' ')[0]}
          </h1>
          <p className="mt-0.5 truncate text-sm text-inksoft">{eventName}</p>
        </div>
        <a
          href="/logout"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border border-ink/15 text-inksoft transition hover:border-ink/30 hover:text-ink"
        >
          <LogoutIcon className="h-[18px] w-[18px]" />
        </a>
      </header>

      {/* Banner si no se puede votar */}
      {!isActive && (
        <div className="mx-5 mt-4 rounded-2xl bg-saffron/15 px-4 py-3 text-sm font-medium text-ink">
          {estado === 'Borrador'
            ? 'El evento aún no ha iniciado. La votación no está disponible en este momento.'
            : 'El evento ya cerró. Tus votos quedaron registrados.'}
        </div>
      )}

      {/* Progreso */}
      {total > 0 && (
        <section className="mx-5 mt-4 rounded-2xl bg-cream px-5 py-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-ink">Tu progreso</span>
            <span className="font-display text-lg font-semibold text-terra">{pct}%</span>
          </div>
          <p className="mt-0.5 text-[13px] text-inksoft">
            Has votado a <b className="text-ink">{votedCount}</b> de <b className="text-ink">{total}</b> equipos
          </p>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-terra to-saffron transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </section>
      )}

      {/* Listas */}
      {total === 0 ? (
        <div className="mx-5 mt-8 rounded-2xl border border-dashed border-ink/20 px-5 py-12 text-center">
          <p className="font-display text-lg font-semibold text-ink">No hay equipos todavía</p>
          <p className="mt-1 text-sm text-inksoft">
            El admin aún no ha añadido equipos a este evento.
          </p>
        </div>
      ) : totalCategorias === 0 ? (
        <div className="mx-5 mt-8 rounded-2xl border border-dashed border-ink/20 px-5 py-12 text-center">
          <p className="font-display text-lg font-semibold text-ink">No hay categorías</p>
          <p className="mt-1 text-sm text-inksoft">
            El admin aún no ha definido categorías de calificación.
          </p>
        </div>
      ) : (
        <div className="mt-2 px-5">
          {pendientes.length > 0 && (
            <>
              <SectionHeader label={`Por votar · ${pendientes.length}`} variant="pending" />
              <ul className="flex flex-col gap-2.5">
                {pendientes.map((eq) => (
                  <TeamRow
                    key={eq.id}
                    team={eq}
                    disabled={!isActive}
                    onClick={() => goToTeam(eq.id)}
                  />
                ))}
              </ul>
            </>
          )}

          {votados.length > 0 && (
            <>
              <SectionHeader label={`Ya votados · ${votados.length}`} variant="done" />
              <ul className="flex flex-col gap-2.5">
                {votados.map((eq) => (
                  <TeamRow
                    key={eq.id}
                    team={eq}
                    disabled={!isActive}
                    onClick={() => goToTeam(eq.id)}
                  />
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </main>
  );
}

function SectionHeader({
  label,
  variant,
}: {
  label: string;
  variant: 'pending' | 'done';
}) {
  const color = variant === 'pending' ? 'text-[#A66E12]' : 'text-olive';
  return (
    <div className="my-4 flex items-center gap-2">
      <span className={`whitespace-nowrap text-xs font-bold uppercase tracking-wider ${color}`}>
        {label}
      </span>
      <span className="h-px flex-1 bg-ink/10" />
    </div>
  );
}

function TeamRow({
  team,
  disabled,
  onClick,
}: {
  team: TeamItem;
  disabled: boolean;
  onClick: () => void;
}) {
  const votado = team.estado === 'votado';
  const base =
    'flex w-full items-center gap-3.5 rounded-2xl border border-ink/8 bg-white px-4 py-3.5 text-left shadow-sm';
  return (
    <li>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} ${
          disabled ? 'cursor-not-allowed opacity-70' : 'transition hover:border-terra/40'
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[17px] font-semibold leading-tight tracking-tight text-ink">
            {team.nombre}
          </div>
          {votado && team.calificacion !== null && (
            <div className="mt-0.5 text-[13px] font-bold text-olive">
              Tu calificación: {team.calificacion.toFixed(1)}
            </div>
          )}
        </div>
        {votado ? (
          <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-olive/12 px-2.5 py-1 text-xs font-bold text-olive">
            <CheckIcon className="h-3 w-3" />
            Votado
          </span>
        ) : (
          <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-saffron/16 px-2.5 py-1 text-xs font-bold text-[#A66E12]">
            <span className="h-1.5 w-1.5 rounded-full bg-saffron" />
            Pendiente
          </span>
        )}
      </button>
    </li>
  );
}
