'use client';
/**
 * Misión Votum · Pantalla 7 — Resultados del Evento
 * Secciones colapsables por categoría · ranking (posición con medalla al 1.º,
 * equipo, promedio 1 decimal, votos) · nota al pie por pocos votos ·
 * banner de resultados parciales (Activo) · exportar a Excel.
 */
const { useState } = React;

const MAX_VOTOS = 6;
const CATEGORIAS = [
  { nombre: 'Fidelidad histórica', filas: [
    { equipo: 'Coliseo · Italia', prom: 4.8, votos: 6 },
    { equipo: 'Taj Mahal · India', prom: 4.6, votos: 6 },
    { equipo: 'Pirámides de Giza · Egipto', prom: 4.5, votos: 5 },
    { equipo: 'Gran Muralla · China', prom: 4.2, votos: 6 },
    { equipo: 'Machu Picchu · Perú', prom: 4.0, votos: 6 },
    { equipo: 'Torre Eiffel · Francia', prom: 3.8, votos: 4 },
    { equipo: 'Sagrada Familia · España', prom: 3.5, votos: 6 },
    { equipo: 'Cristo Redentor · Brasil', prom: 3.1, votos: 5 },
  ] },
  { nombre: 'Creatividad', filas: [
    { equipo: 'Sagrada Familia · España', prom: 4.9, votos: 6 },
    { equipo: 'Torre Eiffel · Francia', prom: 4.7, votos: 4 },
    { equipo: 'Cristo Redentor · Brasil', prom: 4.4, votos: 5 },
    { equipo: 'Taj Mahal · India', prom: 4.2, votos: 6 },
    { equipo: 'Machu Picchu · Perú', prom: 4.1, votos: 6 },
    { equipo: 'Coliseo · Italia', prom: 3.9, votos: 6 },
    { equipo: 'Gran Muralla · China', prom: 3.6, votos: 6 },
    { equipo: 'Pirámides de Giza · Egipto', prom: 3.4, votos: 5 },
  ] },
  { nombre: 'Presentación', filas: [
    { equipo: 'Taj Mahal · India', prom: 4.7, votos: 6 },
    { equipo: 'Machu Picchu · Perú', prom: 4.6, votos: 6 },
    { equipo: 'Coliseo · Italia', prom: 4.5, votos: 6 },
    { equipo: 'Sagrada Familia · España', prom: 4.3, votos: 6 },
    { equipo: 'Torre Eiffel · Francia', prom: 4.0, votos: 4 },
    { equipo: 'Pirámides de Giza · Egipto', prom: 3.8, votos: 5 },
    { equipo: 'Cristo Redentor · Brasil', prom: 3.7, votos: 5 },
    { equipo: 'Gran Muralla · China', prom: 3.3, votos: 6 },
  ] },
  { nombre: 'Trabajo en equipo', filas: [
    { equipo: 'Machu Picchu · Perú', prom: 4.8, votos: 6 },
    { equipo: 'Coliseo · Italia', prom: 4.6, votos: 6 },
    { equipo: 'Gran Muralla · China', prom: 4.5, votos: 6 },
    { equipo: 'Taj Mahal · India', prom: 4.3, votos: 6 },
    { equipo: 'Sagrada Familia · España', prom: 4.1, votos: 6 },
    { equipo: 'Cristo Redentor · Brasil', prom: 3.9, votos: 5 },
    { equipo: 'Torre Eiffel · Francia', prom: 3.6, votos: 4 },
    { equipo: 'Pirámides de Giza · Egipto', prom: 3.5, votos: 5 },
  ] },
];

const ORDINAL = ['1.°', '2.°', '3.°', '4.°', '5.°', '6.°', '7.°', '8.°'];

function CategorySection({ cat, abierta, onToggle }) {
  const pocos = cat.filas.some((f) => f.votos < MAX_VOTOS);
  return (
    <section className="overflow-hidden rounded-2xl border border-ink/10 bg-cream/30">
      <button onClick={onToggle} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-cream/60 lg:px-6">
        <div className="flex items-center gap-3">
          <span className="font-display text-xl font-semibold tracking-tight text-ink lg:text-2xl">{cat.nombre}</span>
          <span className="rounded-full bg-ink/8 px-2.5 py-0.5 text-xs font-bold text-inksoft">{cat.filas.length} equipos</span>
        </div>
        <span className="flex items-center gap-3 text-sm text-inksoft">
          <span className="hidden sm:inline">Líder: <span className="font-bold text-ink">{cat.filas[0].equipo.split(' · ')[0]}</span></span>
          <svg viewBox="0 0 24 24" className={`h-5 w-5 flex-shrink-0 text-inkfaint transition-transform ${abierta ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
        </span>
      </button>

      {abierta && (
        <div className="border-t border-ink/10">
          {/* encabezado de columnas */}
          <div className="grid grid-cols-[56px_1fr_84px_72px] items-center gap-3 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-inkfaint lg:px-6">
            <span>Pos.</span><span>Equipo</span><span className="text-right">Promedio</span><span className="text-right">Votos</span>
          </div>
          <ul>
            {cat.filas.map((f, i) => {
              const first = i === 0;
              return (
                <li key={f.equipo} className={`grid grid-cols-[56px_1fr_84px_72px] items-center gap-3 border-t border-ink/8 px-5 py-3 lg:px-6 ${first ? 'bg-saffron/12' : ''}`}>
                  <span className="flex items-center">
                    {first ? (
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-saffron/25 text-base" title="Primer lugar">🥇</span>
                    ) : i === 1 ? (
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-ink/6 text-base">🥈</span>
                    ) : i === 2 ? (
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-terra/8 text-base">🥉</span>
                    ) : (
                      <span className="pl-1 font-display text-base font-semibold text-inkfaint">{ORDINAL[i]}</span>
                    )}
                  </span>
                  <span className={`min-w-0 truncate text-[15px] ${first ? 'font-bold text-ink' : 'font-semibold text-ink'}`}>{f.equipo}</span>
                  <span className={`text-right font-display text-lg font-semibold ${first ? 'text-terra' : 'text-ink'}`}>{f.prom.toFixed(1)}</span>
                  <span className="flex items-center justify-end gap-1 text-right text-sm">
                    <span className={`font-bold ${f.votos < MAX_VOTOS ? 'text-saffron' : 'text-inksoft'}`}>{f.votos}</span>
                    <span className="text-inkfaint">/{MAX_VOTOS}</span>
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
        </div>
      )}
    </section>
  );
}

function ResultsScreen() {
  const [abierta, setAbierta] = useState(0); // primera categoría abierta
  const [exportando, setExportando] = useState(false);
  const [toast, setToast] = useState(false);

  function exportar() {
    setExportando(true);
    setTimeout(() => { setExportando(false); setToast(true); setTimeout(() => setToast(false), 2400); }, 900);
  }

  return (
    <div className="min-h-screen bg-ivory font-body text-ink">
      <window.AdminHeader subtitle="Resultados" />

      {/* encabezado del evento */}
      <div className="border-b border-ink/10 bg-cream/30">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <window.StatusBadge estado="Activo" />
            <h1 className="min-w-0 truncate font-display text-3xl font-semibold leading-tight tracking-tight text-ink md:text-4xl">Resultados · Monumentos del Mundo</h1>
          </div>
          <button onClick={exportar} disabled={exportando} className="inline-flex flex-shrink-0 items-center gap-2 self-start rounded-xl bg-olive px-4 py-2.5 text-sm font-bold text-ivory transition hover:bg-olive/90 disabled:opacity-70 sm:self-auto">
            {exportando ? (
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] animate-spin" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
            )}
            {exportando ? 'Exportando…' : 'Exportar a Excel'}
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
        {/* banner resultados parciales (solo Activo) */}
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-saffron/40 bg-saffron/12 px-4 py-3 text-sm">
          <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 flex-shrink-0 text-saffron" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.3" /></svg>
          <span className="font-medium text-ink"><span className="font-bold">Resultados parciales</span> — el evento sigue activo y los votos pueden cambiar.</span>
        </div>

        <div className="space-y-3.5">
          {CATEGORIAS.map((cat, i) => (
            <CategorySection key={cat.nombre} cat={cat} abierta={abierta === i} onToggle={() => setAbierta(abierta === i ? -1 : i)} />
          ))}
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2">
          <div className="flex items-center gap-2.5 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-ivory shadow-2xl">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-olive"><svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span>
            Archivo exportado · resultados-monumentos.xlsx
          </div>
        </div>
      )}
    </div>
  );
}

window.ResultsScreen = ResultsScreen;
