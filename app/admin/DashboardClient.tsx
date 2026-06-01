'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { StatusBadge, type EstadoEvento } from '@/components/ui/StatusBadge';
import { ConfirmDialog, type ConfirmData } from '@/components/ui/ConfirmDialog';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  UsersIcon,
  GavelIcon,
  ChevronRightIcon,
} from '@/components/ui/icons';
import { createEvent, deleteEvent } from './actions';

export interface EventoVM {
  id: string;
  nombre: string;
  estado: EstadoEvento;
  fecha: string | null; // ISO o null
  categorias: number;
  equipos: number;
  jueces: number;
  votos: number;
  progreso: number;
}

function formatFecha(iso: string | null): string {
  if (!iso) return 'Fecha por definir';
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function MetricChip({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-inksoft">
      <span className="text-inkfaint">{icon}</span>
      <span className="font-bold text-ink">{value}</span>
      <span className="text-inkfaint">{label}</span>
    </span>
  );
}

function EventoCard({
  ev,
  onConfigure,
  onDelete,
}: {
  ev: EventoVM;
  onConfigure: () => void;
  onDelete: () => void;
}) {
  const borrador = ev.estado === 'Borrador';
  const cerrado = ev.estado === 'Cerrado';
  return (
    <article className="group relative flex flex-col gap-4 rounded-2xl border border-ink/10 bg-cream/40 p-5 transition hover:border-terra/40 hover:bg-cream/70 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
      <span
        className={`absolute left-0 top-5 h-[calc(100%-2.5rem)] w-1 rounded-r-full ${
          ev.estado === 'Activo' ? 'bg-olive' : cerrado ? 'bg-[#3F5168]' : 'bg-inkfaint/50'
        }`}
      />

      <button className="flex-1 text-left" onClick={onConfigure}>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge estado={ev.estado} />
          <span className="inline-flex items-center gap-1.5 text-xs text-inkfaint">
            <CalendarIcon className="h-3.5 w-3.5" /> {formatFecha(ev.fecha)}
          </span>
        </div>
        <h3 className="mt-2.5 font-display text-2xl font-semibold leading-tight tracking-tight text-ink">
          {ev.nombre}
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
          <MetricChip icon={<GavelIcon className="h-3.5 w-3.5" />} value={ev.categorias} label={ev.categorias === 1 ? 'categoría' : 'categorías'} />
          <MetricChip icon={<UsersIcon className="h-3.5 w-3.5" />} value={ev.equipos} label={ev.equipos === 1 ? 'equipo' : 'equipos'} />
          <MetricChip icon={<GavelIcon className="h-3.5 w-3.5" />} value={ev.jueces} label={ev.jueces === 1 ? 'juez' : 'jueces'} />
          {!borrador && (
            <span className="inline-flex items-center gap-2 text-[13px]">
              <span className="text-inkfaint">{cerrado ? 'Resultado' : 'Progreso'}</span>
              <span className="font-bold text-terra">{ev.progreso}%</span>
            </span>
          )}
        </div>
      </button>

      <div className="flex items-center gap-2 sm:flex-col sm:items-end lg:flex-row lg:items-center">
        <button
          onClick={onConfigure}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink/15 px-3.5 py-2 text-sm font-bold text-ink transition hover:border-terra hover:text-terra"
          title="Configurar evento"
        >
          <PencilIcon className="h-4 w-4" /> <span className="hidden sm:inline">Configurar</span>
        </button>
        <button
          onClick={onDelete}
          className="grid h-9 w-9 place-items-center rounded-lg border border-ink/15 text-inksoft transition hover:border-danger/50 hover:bg-danger/8 hover:text-danger"
          title="Eliminar evento"
          aria-label="Eliminar evento"
        >
          <TrashIcon className="h-[18px] w-[18px]" />
        </button>
        <span className="ml-1 hidden text-inkfaint transition group-hover:translate-x-0.5 group-hover:text-terra lg:block">
          <ChevronRightIcon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

export function DashboardClient({ eventos }: { eventos: EventoVM[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<ConfirmData | null>(null);
  const [target, setTarget] = useState<EventoVM | null>(null);

  const activos = eventos.filter((e) => e.estado === 'Activo').length;

  function goToConfig(id: string) {
    router.push(`/admin/eventos/${id}`);
  }

  function requestDelete(ev: EventoVM) {
    setTarget(ev);
    if (ev.estado === 'Borrador') {
      setConfirm({
        title: '¿Eliminar este evento?',
        body: `Se eliminará "${ev.nombre}". Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
        confirmClass: 'bg-danger hover:bg-danger/90',
      });
    } else {
      setConfirm({
        title: 'Eliminar evento con datos',
        body: `Esto eliminará el evento "${ev.nombre}" y todos sus ${ev.votos} votos registrados. Escribe el nombre del evento para confirmar.`,
        requireText: ev.nombre,
        confirmLabel: 'Eliminar evento',
        confirmClass: 'bg-danger hover:bg-danger/90',
      });
    }
  }

  function confirmDelete() {
    if (!target) return;
    const id = target.id;
    startTransition(async () => {
      const res = await deleteEvent(id);
      if (res.ok) {
        setConfirm(null);
        setTarget(null);
        router.refresh();
      } else {
        alert(res.error ?? 'No se pudo eliminar.');
      }
    });
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-ink md:text-5xl">Eventos</h1>
          <p className="mt-2 text-[15px] text-inksoft">
            {eventos.length} {eventos.length === 1 ? 'evento' : 'eventos'} · {activos} {activos === 1 ? 'activo' : 'activos'} ahora
          </p>
        </div>
        <form action={createEvent}>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-terra px-5 py-3.5 text-base font-bold text-ivory shadow-terra transition hover:bg-terradeep"
          >
            <PlusIcon className="h-5 w-5" /> Crear nuevo evento
          </button>
        </form>
      </div>

      {eventos.length === 0 ? (
        <div className="mt-16 flex flex-col items-center rounded-2xl border border-dashed border-ink/20 bg-cream/30 px-6 py-20 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-terra/10 text-terra">
            <CalendarIcon className="h-7 w-7" />
          </span>
          <h3 className="mt-5 font-display text-2xl font-semibold text-ink">Todavía no hay eventos creados</h3>
          <p className="mt-2 max-w-sm text-[15px] text-inksoft">
            Crea tu primer evento para empezar a configurar categorías, equipos y jueces.
          </p>
          <form action={createEvent} className="mt-6">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-terra px-5 py-3 text-base font-bold text-ivory shadow-terra transition hover:bg-terradeep"
            >
              <PlusIcon className="h-5 w-5" /> Crear el primer evento
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {eventos.map((ev) => (
            <EventoCard
              key={ev.id}
              ev={ev}
              onConfigure={() => goToConfig(ev.id)}
              onDelete={() => requestDelete(ev)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        data={confirm}
        busy={pending}
        onCancel={() => {
          setConfirm(null);
          setTarget(null);
        }}
        onConfirm={confirmDelete}
      />
    </main>
  );
}
