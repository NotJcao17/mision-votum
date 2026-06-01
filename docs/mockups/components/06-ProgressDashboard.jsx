'use client';
/**
 * Misión Votum · Pantalla 6 — Dashboard de Progreso
 * Métrica global + barra ancha + resumen textual + lista de jueces ordenada
 * (sin votos primero, completos al final). Se actualiza al pulsar "Refrescar".
 */
const { useState, useMemo } = React;

const TOTAL_EQUIPOS = 8;
const JUECES_PROGRESO = [
  { id: 4, nombre: 'Takeshi Mori', rol: 'Cocina internacional', votados: 0 },
  { id: 6, nombre: 'Rafael Bravo', rol: 'Comunidad', votados: 0 },
  { id: 5, nombre: 'Sofía Paz', rol: 'Nutrición', votados: 3 },
  { id: 3, nombre: 'Ana Duarte', rol: 'Crítica culinaria', votados: 5 },
  { id: 2, nombre: 'Javier Ríos', rol: 'Chef invitado', votados: 6 },
  { id: 1, nombre: 'María López', rol: 'Gastronomía', votados: 8 },
];

function rango(j) {
  // sin votos → 0 (primero); completo → 2 (último); en curso → 1
  if (j.votados === 0) return 0;
  if (j.votados >= TOTAL_EQUIPOS) return 2;
  return 1;
}

function ProgressDashboard() {
  const I = window.MVIcons;
  const [jueces, setJueces] = useState(JUECES_PROGRESO);
  const [updatedAt, setUpdatedAt] = useState('hace 1 min');
  const [spinning, setSpinning] = useState(false);

  const ordenados = useMemo(() => {
    return [...jueces].sort((a, b) => {
      const ra = rango(a), rb = rango(b);
      if (ra !== rb) return ra - rb;
      return a.votados - b.votados; // dentro del grupo en curso, menor avance primero
    });
  }, [jueces]);

  const totalVotos = jueces.length * TOTAL_EQUIPOS;
  const emitidos = jueces.reduce((s, j) => s + j.votados, 0);
  const pctGlobal = Math.round((emitidos / totalVotos) * 100);
  const completos = jueces.filter((j) => j.votados >= TOTAL_EQUIPOS).length;
  const sinVotos = jueces.filter((j) => j.votados === 0).length;

  function refrescar() {
    setSpinning(true);
    // Simula avance real: jueces en curso suman 1-2 equipos (tope en el total).
    setTimeout(() => {
      setJueces((prev) => prev.map((j) => {
        if (j.votados === 0 || j.votados >= TOTAL_EQUIPOS) return j;
        return { ...j, votados: Math.min(TOTAL_EQUIPOS, j.votados + (Math.random() > 0.5 ? 1 : 0)) };
      }));
      setUpdatedAt('justo ahora');
      setSpinning(false);
    }, 650);
  }

  return (
    <div className="min-h-screen bg-ivory font-body text-ink">
      <window.AdminHeader subtitle="Dashboard de progreso" />

      {/* encabezado del evento */}
      <div className="border-b border-ink/10 bg-cream/30">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <window.StatusBadge estado="Activo" />
            <h1 className="min-w-0 truncate font-display text-3xl font-semibold leading-tight tracking-tight text-ink md:text-4xl">Progreso · Monumentos del Mundo</h1>
          </div>
          <button onClick={refrescar} className="inline-flex flex-shrink-0 items-center gap-2 self-start rounded-xl border border-ink/20 px-4 py-2.5 text-sm font-bold text-ink transition hover:border-terra hover:text-terra sm:self-auto">
            <svg viewBox="0 0 24 24" className={`h-[18px] w-[18px] ${spinning ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" /></svg>
            Refrescar
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
        {/* métrica global */}
        <section className="rounded-2xl border border-ink/10 bg-cream/30 p-6 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-12">
            <div className="lg:w-72 lg:flex-shrink-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-inksoft">Progreso global de votación</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-7xl font-semibold leading-none tracking-tight text-terra lg:text-8xl">{pctGlobal}</span>
                <span className="font-display text-3xl font-medium text-terra">%</span>
                <span className="ml-1 pb-1 text-sm font-bold text-inksoft">completado</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="h-4 w-full overflow-hidden rounded-full bg-ink/8">
                <div className="h-full rounded-full bg-gradient-to-r from-terra to-saffron transition-[width] duration-500" style={{ width: pctGlobal + '%' }} />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-inksoft"><span className="font-bold text-ink">{emitidos}</span> de <span className="font-bold text-ink">{totalVotos}</span> votos emitidos</span>
                <span className="text-inkfaint">Actualizado {updatedAt} · no automático</span>
              </div>
              <p className="mt-4 text-[15px] text-ink">
                <span className="font-bold">{completos} de {jueces.length} jueces</span> han completado todos sus votos.
                {sinVotos > 0 && <span className="text-inksoft"> {sinVotos} {sinVotos === 1 ? 'aún no ha' : 'aún no han'} empezado.</span>}
              </p>
            </div>
          </div>
        </section>

        {/* lista de jueces */}
        <div className="mt-7 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">Progreso por juez</h2>
          <span className="text-sm text-inkfaint">{TOTAL_EQUIPOS} equipos por juez</span>
        </div>

        <ul className="mt-4 space-y-2.5">
          {ordenados.map((j) => {
            const pct = Math.round((j.votados / TOTAL_EQUIPOS) * 100);
            const completo = j.votados >= TOTAL_EQUIPOS;
            const sin = j.votados === 0;
            const barColor = completo ? 'bg-olive' : sin ? 'bg-danger/40' : 'bg-terra';
            return (
              <li key={j.id} className="rounded-2xl border border-ink/10 bg-cream/30 px-5 py-4 transition hover:bg-cream/60">
                <div className="flex items-center gap-4">
                  <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-ivory font-body text-sm font-bold text-inksoft ring-1 ring-ink/10">{j.nombre.split(' ').map((p) => p[0]).slice(0, 2).join('')}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-bold text-ink">{j.nombre}</span>
                      {sin && <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/12 px-2.5 py-0.5 text-xs font-bold text-danger"><span className="h-1.5 w-1.5 rounded-full bg-danger" />Sin votos</span>}
                      {completo && <span className="inline-flex items-center gap-1.5 rounded-full bg-olive/12 px-2.5 py-0.5 text-xs font-bold text-olive"><span className="h-1.5 w-1.5 rounded-full bg-olive" />Completo</span>}
                    </div>
                    <div className="mt-0.5 text-xs text-inkfaint">{j.rol}</div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="font-display text-xl font-semibold text-ink">{pct}%</div>
                    <div className="text-xs text-inksoft">{j.votados} / {TOTAL_EQUIPOS} equipos</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/8">
                    <div className={`h-full rounded-full ${barColor} transition-[width] duration-500`} style={{ width: pct + '%' }} />
                  </div>
                  <span className="w-28 flex-shrink-0 text-right text-xs font-bold text-inksoft sm:hidden">{j.votados} / {TOTAL_EQUIPOS} · {pct}%</span>
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}

window.ProgressDashboard = ProgressDashboard;
