'use client';
/**
 * Misión Votum · Pantalla 2 — Dashboard Principal del Admin
 * Lista de eventos ordenada: Activos → Borrador → Cerrados.
 * Cada tarjeta: nombre, fecha, badge de estado, métricas, editar, eliminar.
 */
const { useState } = React; // Next.js: import { useState } from 'react';

// Datos de ejemplo realistas
const EVENTOS_SEED = [
  { id: 1, nombre: 'Comida del Mundo', fecha: '18 de junio, 2026', estado: 'Activo', categorias: 4, equipos: 12, jueces: 6, progreso: 68 },
  { id: 2, nombre: 'Danzas Típicas del Mundo', fecha: '19 de junio, 2026', estado: 'Activo', categorias: 3, equipos: 9, jueces: 5, progreso: 24 },
  { id: 3, nombre: 'Monumentos del Mundo', fecha: '20 de junio, 2026', estado: 'Borrador', categorias: 0, equipos: 0, jueces: 0, progreso: 0 },
  { id: 4, nombre: 'Vestimenta Típica', fecha: 'Fecha por definir', estado: 'Borrador', categorias: 4, equipos: 8, jueces: 0, progreso: 0 },
  { id: 5, nombre: 'Feria Cultural 2025', fecha: '14 de junio, 2025', estado: 'Cerrado', categorias: 4, equipos: 14, jueces: 7, progreso: 100 },
];

const ORDEN = { Activo: 0, Borrador: 1, Cerrado: 2 };

function MetricChip({ icon, value, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-inksoft">
      <span className="text-inkfaint">{icon}</span>
      <span className="font-bold text-ink">{value}</span>
      <span className="text-inkfaint">{label}</span>
    </span>
  );
}

function EventoCard({ ev, onDelete }) {
  const I = window.MVIcons;
  const borrador = ev.estado === 'Borrador';
  const cerrado = ev.estado === 'Cerrado';
  return (
    <article className="group relative flex flex-col gap-4 rounded-2xl border border-ink/10 bg-cream/40 p-5 transition hover:border-terra/40 hover:bg-cream/70 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
      {/* franja de estado */}
      <span className={`absolute left-0 top-5 h-[calc(100%-2.5rem)] w-1 rounded-r-full ${ev.estado === 'Activo' ? 'bg-olive' : cerrado ? 'bg-[#3F5168]' : 'bg-inkfaint/50'}`} />

      <button className="flex-1 text-left" onClick={() => {}}>
        <div className="flex flex-wrap items-center gap-3">
          <window.StatusBadge estado={ev.estado} />
          <span className="inline-flex items-center gap-1.5 text-xs text-inkfaint">
            {I.calendar('h-3.5 w-3.5')} {ev.fecha}
          </span>
        </div>
        <h3 className="mt-2.5 font-display text-2xl font-semibold leading-tight tracking-tight text-ink">{ev.nombre}</h3>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
          <MetricChip icon={I.gavel('h-3.5 w-3.5')} value={ev.categorias} label={ev.categorias === 1 ? 'categoría' : 'categorías'} />
          <MetricChip icon={I.users('h-3.5 w-3.5')} value={ev.equipos} label={ev.equipos === 1 ? 'equipo' : 'equipos'} />
          <MetricChip icon={I.gavel('h-3.5 w-3.5')} value={ev.jueces} label={ev.jueces === 1 ? 'juez' : 'jueces'} />
          {!borrador && (
            <span className="inline-flex items-center gap-2 text-[13px]">
              <span className="text-inkfaint">{cerrado ? 'Resultado' : 'Progreso'}</span>
              <span className="font-bold text-terra">{ev.progreso}%</span>
            </span>
          )}
        </div>
      </button>

      {/* acciones */}
      <div className="flex items-center gap-2 sm:flex-col sm:items-end lg:flex-row lg:items-center">
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-ink/15 px-3.5 py-2 text-sm font-bold text-ink transition hover:border-terra hover:text-terra" title="Configurar evento">
          {I.pencil('h-4 w-4')} <span className="hidden sm:inline">Configurar</span>
        </button>
        <button onClick={() => onDelete(ev)} className="grid h-9 w-9 place-items-center rounded-lg border border-ink/15 text-inksoft transition hover:border-danger/50 hover:bg-danger/8 hover:text-danger" title="Eliminar evento" aria-label="Eliminar evento">
          {I.trash('h-[18px] w-[18px]')}
        </button>
        <span className="ml-1 hidden text-inkfaint transition group-hover:translate-x-0.5 group-hover:text-terra lg:block">{I.chevright('h-5 w-5')}</span>
      </div>
    </article>
  );
}

function AdminDashboard() {
  const [eventos, setEventos] = useState(EVENTOS_SEED);
  const ordenados = [...eventos].sort((a, b) => ORDEN[a.estado] - ORDEN[b.estado]);
  const activos = eventos.filter((e) => e.estado === 'Activo').length;

  function handleDelete(ev) {
    // Mockup: en producción dispara confirmación (simple si Borrador, fuerte si tiene votos).
    setEventos((prev) => prev.filter((e) => e.id !== ev.id));
  }

  return (
    <div className="min-h-screen bg-ivory font-body text-ink">
      <window.AdminHeader subtitle="Panel de administración" />

      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
        {/* encabezado de página */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-ink md:text-5xl">Eventos</h1>
            <p className="mt-2 text-[15px] text-inksoft">
              {eventos.length} {eventos.length === 1 ? 'evento' : 'eventos'} · {activos} {activos === 1 ? 'activo' : 'activos'} ahora
            </p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-terra px-5 py-3.5 text-base font-bold text-ivory shadow-terra transition hover:bg-terradeep">
            {window.MVIcons.plus('h-5 w-5')} Crear nuevo evento
          </button>
        </div>

        {/* lista o estado vacío */}
        {ordenados.length === 0 ? (
          <div className="mt-16 flex flex-col items-center rounded-2xl border border-dashed border-ink/20 bg-cream/30 px-6 py-20 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-terra/10 text-terra">{window.MVIcons.calendar('h-7 w-7')}</span>
            <h3 className="mt-5 font-display text-2xl font-semibold text-ink">Todavía no hay eventos creados</h3>
            <p className="mt-2 max-w-sm text-[15px] text-inksoft">Crea tu primer evento para empezar a configurar categorías, equipos y jueces.</p>
            <button className="mt-6 inline-flex items-center gap-2 rounded-xl bg-terra px-5 py-3 text-base font-bold text-ivory shadow-terra transition hover:bg-terradeep">
              {window.MVIcons.plus('h-5 w-5')} Crear el primer evento
            </button>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-4">
            {ordenados.map((ev) => (
              <EventoCard key={ev.id} ev={ev} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

window.AdminDashboard = AdminDashboard;
