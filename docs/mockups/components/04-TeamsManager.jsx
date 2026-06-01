'use client';
/**
 * Misión Votum · Pantalla 4 — Gestión de Equipos
 * Búsqueda en vivo · añadir/editar (modal) · importar lote (modal con preview
 * dinámico y líneas con error resaltadas) · eliminar con confirmación según votos.
 */
const { useState, useMemo, useEffect, useRef } = React;

const EQUIPOS_SEED = [
  { id: 1, nombre: 'Torre Eiffel · Francia', votos: 18 },
  { id: 2, nombre: 'Coliseo · Italia', votos: 22 },
  { id: 3, nombre: 'Taj Mahal · India', votos: 15 },
  { id: 4, nombre: 'Machu Picchu · Perú', votos: 20 },
  { id: 5, nombre: 'Pirámides de Giza · Egipto', votos: 12 },
  { id: 6, nombre: 'Sagrada Familia · España', votos: 17 },
  { id: 7, nombre: 'Gran Muralla · China', votos: 9 },
  { id: 8, nombre: 'Cristo Redentor · Brasil', votos: 0 },
];

const inputCls4 = 'w-full rounded-xl border border-ink/15 bg-cream/60 px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-inkfaint/70 focus:border-terra focus:bg-cream focus:ring-2 focus:ring-terra/25';

// ── Modal base ───────────────────────────────────────────────────
function Modal({ children, onClose, max = 'max-w-md' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-6 backdrop-blur-sm" onClick={onClose}>
      <div className={`w-full ${max} rounded-2xl border border-ink/10 bg-ivory p-6 shadow-2xl`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ── Modal añadir / editar ────────────────────────────────────────
function TeamModal({ equipo, onSave, onClose }) {
  const [nombre, setNombre] = useState(equipo ? equipo.nombre : '');
  const ref = useRef(null);
  useEffect(() => { ref.current && ref.current.focus(); }, []);
  return (
    <Modal onClose={onClose}>
      <h3 className="font-display text-2xl font-semibold text-ink">{equipo ? 'Editar equipo' : 'Añadir equipo'}</h3>
      <p className="mt-1 text-sm text-inksoft">{equipo ? 'Cambia el nombre del equipo.' : 'Crea un nuevo equipo para este evento.'}</p>
      <div className="mt-5">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inksoft">Nombre del equipo</label>
        <input ref={ref} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="ej. Torre Eiffel · Francia" className={inputCls4}
          onKeyDown={(e) => { if (e.key === 'Enter' && nombre.trim()) onSave(nombre.trim()); }} />
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-bold text-inksoft transition hover:bg-ink/5 hover:text-ink">Cancelar</button>
        <button disabled={!nombre.trim()} onClick={() => onSave(nombre.trim())}
          className="rounded-lg bg-terra px-4 py-2.5 text-sm font-bold text-ivory transition hover:bg-terradeep disabled:cursor-not-allowed disabled:opacity-40">Guardar</button>
      </div>
    </Modal>
  );
}

// ── Modal importar lote ──────────────────────────────────────────
function ImportModal({ existentes, onImport, onClose }) {
  const [texto, setTexto] = useState('Pirámide de Chichén Itzá · México\nÓpera de Sídney · Australia\nBig Ben · Reino Unido\nÓpera de Sídney · Australia\n\nPetra · Jordania');
  const ref = useRef(null);
  useEffect(() => { ref.current && ref.current.focus(); }, []);

  const existSet = useMemo(() => new Set(existentes.map((e) => e.nombre.trim().toLowerCase())), [existentes]);

  // Analiza cada línea: ok | vacía | duplicada (en lista o dentro del texto)
  const lineas = useMemo(() => {
    const vistos = new Set();
    return texto.split('\n').map((raw) => {
      const val = raw.trim();
      let estado = 'ok';
      if (val === '') estado = 'vacia';
      else if (existSet.has(val.toLowerCase())) estado = 'existe';
      else if (vistos.has(val.toLowerCase())) estado = 'dup';
      else vistos.add(val.toLowerCase());
      return { raw, val, estado };
    });
  }, [texto, existSet]);

  const validas = lineas.filter((l) => l.estado === 'ok');
  const errores = lineas.filter((l) => l.estado === 'existe' || l.estado === 'dup');

  return (
    <Modal onClose={onClose} max="max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-2xl font-semibold text-ink">Importar equipos</h3>
          <p className="mt-1 text-sm text-inksoft">Escribe un nombre de equipo por línea.</p>
        </div>
        <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-inksoft transition hover:bg-ink/5 hover:text-ink" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {/* textarea */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inksoft">Nombres</label>
          <textarea ref={ref} value={texto} onChange={(e) => setTexto(e.target.value)} rows={7}
            className={`${inputCls4} resize-none font-mono text-sm leading-relaxed`} spellCheck={false} />
        </div>
        {/* preview */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inksoft">Vista previa</label>
          <div className="h-[calc(7*1.625em+1.5rem)] overflow-y-auto rounded-xl border border-ink/12 bg-cream/40 p-3">
            {lineas.map((l, i) => {
              if (l.estado === 'vacia') return <div key={i} className="h-[1.625em]" />;
              const bad = l.estado === 'existe' || l.estado === 'dup';
              return (
                <div key={i} className={`flex items-center gap-2 rounded px-1.5 py-0.5 text-sm leading-relaxed ${bad ? 'bg-danger/10 text-danger' : 'text-ink'}`}>
                  {bad ? (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 flex-shrink-0 text-olive" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  )}
                  <span className="truncate">{l.val}</span>
                  {l.estado === 'existe' && <span className="ml-auto flex-shrink-0 text-xs font-bold">ya existe</span>}
                  {l.estado === 'dup' && <span className="ml-auto flex-shrink-0 text-xs font-bold">duplicado</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* resumen + acciones */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          <span className="font-bold text-ink">Se importarán {validas.length} {validas.length === 1 ? 'equipo' : 'equipos'}.</span>
          {errores.length > 0 && (
            <span className="ml-2 font-medium text-danger">{errores.length} {errores.length === 1 ? 'línea' : 'líneas'} con error se omitirán.</span>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-bold text-inksoft transition hover:bg-ink/5 hover:text-ink">Cancelar</button>
          <button disabled={validas.length === 0} onClick={() => onImport(validas.map((l) => l.val))}
            className="rounded-lg bg-terra px-4 py-2.5 text-sm font-bold text-ivory transition hover:bg-terradeep disabled:cursor-not-allowed disabled:opacity-40">
            Importar {validas.length > 0 ? validas.length : ''}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Confirmación de borrado ──────────────────────────────────────
function DeleteModal({ equipo, onCancel, onConfirm }) {
  const [text, setText] = useState('');
  const fuerte = equipo.votos > 0;
  const ok = !fuerte || text.trim().toLowerCase() === 'eliminar';
  return (
    <Modal onClose={onCancel}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-danger/12 text-danger">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 8v5M12 16.5v.3M10.3 3.9 2.4 18a1.8 1.8 0 0 0 1.6 2.7h16a1.8 1.8 0 0 0 1.6-2.7L13.7 3.9a1.8 1.8 0 0 0-3.4 0Z" /></svg>
        </span>
        <div className="flex-1">
          <h3 className="font-display text-xl font-semibold text-ink">Eliminar equipo</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-inksoft">
            {fuerte
              ? <>Esto eliminará al equipo <span className="font-bold text-ink">{equipo.nombre}</span> y sus <span className="font-bold text-ink">{equipo.votos} votos</span> registrados.</>
              : <>Se eliminará al equipo <span className="font-bold text-ink">{equipo.nombre}</span>. No tiene votos registrados.</>}
          </p>
        </div>
      </div>
      {fuerte && (
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inksoft">Escribe <span className="font-bold text-danger">eliminar</span> para confirmar</label>
          <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="eliminar"
            className="w-full rounded-lg border border-ink/15 bg-cream/60 px-3 py-2.5 text-sm text-ink outline-none focus:border-danger focus:ring-2 focus:ring-danger/20" />
        </div>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onCancel} className="rounded-lg px-4 py-2.5 text-sm font-bold text-inksoft transition hover:bg-ink/5 hover:text-ink">Cancelar</button>
        <button disabled={!ok} onClick={onConfirm} className="rounded-lg bg-danger px-4 py-2.5 text-sm font-bold text-ivory transition hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-40">Eliminar</button>
      </div>
    </Modal>
  );
}

function TeamsManager() {
  const I = window.MVIcons;
  const [equipos, setEquipos] = useState(EQUIPOS_SEED);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState({ tipo: 'import' }); // import abierto por defecto (demo)
  const [toEdit, setToEdit] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const filtrados = useMemo(
    () => equipos.filter((e) => e.nombre.toLowerCase().includes(query.trim().toLowerCase())),
    [equipos, query]
  );
  const totalVotos = equipos.reduce((s, e) => s + e.votos, 0);

  function saveTeam(nombre) {
    if (toEdit) setEquipos(equipos.map((e) => (e.id === toEdit.id ? { ...e, nombre } : e)));
    else setEquipos([...equipos, { id: Date.now(), nombre, votos: 0 }]);
    setModal(null); setToEdit(null);
  }
  function importTeams(nombres) {
    const base = Math.max(0, ...equipos.map((e) => e.id));
    setEquipos([...equipos, ...nombres.map((n, i) => ({ id: base + i + 1, nombre: n, votos: 0 }))]);
    setModal(null);
  }
  function deleteTeam() { setEquipos(equipos.filter((e) => e.id !== toDelete.id)); setToDelete(null); }

  return (
    <div className="min-h-screen bg-ivory font-body text-ink">
      <window.AdminHeader subtitle="Gestión de equipos" />

      {/* encabezado del evento */}
      <div className="border-b border-ink/10 bg-cream/30">
        <div className="mx-auto max-w-5xl px-6 py-6 lg:px-10">
          <button className="mb-3 inline-flex items-center gap-1.5 text-sm font-bold text-inksoft transition hover:text-terra">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            Volver a configuración
          </button>
          <div className="flex min-w-0 items-center gap-3">
            <window.StatusBadge estado="Activo" />
            <h1 className="min-w-0 truncate font-display text-3xl font-semibold leading-tight tracking-tight text-ink md:text-4xl">Equipos · Monumentos del Mundo</h1>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
        {/* barra de herramientas */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:max-w-xs sm:flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-inkfaint">
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            </span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar equipo…"
              className="w-full rounded-xl border border-ink/15 bg-cream/60 py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-inkfaint/70 focus:border-terra focus:bg-cream focus:ring-2 focus:ring-terra/25" />
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => { setToEdit(null); setModal({ tipo: 'team' }); }}
              className="inline-flex items-center gap-2 rounded-xl bg-terra px-4 py-2.5 text-sm font-bold text-ivory shadow-terra transition hover:bg-terradeep">
              {I.plus('h-4 w-4')} Añadir equipo
            </button>
            <button onClick={() => setModal({ tipo: 'import' })}
              className="inline-flex items-center gap-2 rounded-xl border border-ink/20 px-4 py-2.5 text-sm font-bold text-ink transition hover:border-terra hover:text-terra">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
              Importar lote
            </button>
          </div>
        </div>

        {/* contador */}
        <p className="mt-5 text-sm text-inksoft">
          <span className="font-bold text-ink">{equipos.length}</span> equipos · <span className="font-bold text-ink">{totalVotos}</span> votos en total
          {query && <> · {filtrados.length} {filtrados.length === 1 ? 'coincidencia' : 'coincidencias'}</>}
        </p>

        {/* lista */}
        {equipos.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-ink/20 px-6 py-16 text-center">
            <p className="font-display text-xl font-semibold text-ink">Aún no hay equipos</p>
            <p className="mt-1 text-sm text-inksoft">Añade el primero con el botón de arriba.</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-ink/20 px-6 py-12 text-center text-inksoft">
            Sin resultados para “<span className="font-semibold text-ink">{query}</span>”.
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-ink/8 overflow-hidden rounded-2xl border border-ink/10 bg-cream/30">
            {filtrados.map((eq, i) => (
              <li key={eq.id} className="flex items-center gap-4 px-5 py-4 transition hover:bg-cream/60">
                <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-ivory font-display text-sm font-semibold text-inksoft ring-1 ring-ink/10">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-ink">{eq.nombre}</span>
                <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${eq.votos > 0 ? 'bg-olive/12 text-olive' : 'bg-ink/8 text-inkfaint'}`}>
                  {eq.votos} {eq.votos === 1 ? 'voto' : 'votos'}
                </span>
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <button onClick={() => { setToEdit(eq); setModal({ tipo: 'team' }); }} className="grid h-9 w-9 place-items-center rounded-lg text-inksoft transition hover:bg-terra/10 hover:text-terra" title="Editar" aria-label="Editar equipo">{I.pencil('h-[18px] w-[18px]')}</button>
                  <button onClick={() => setToDelete(eq)} className="grid h-9 w-9 place-items-center rounded-lg text-inksoft transition hover:bg-danger/8 hover:text-danger" title="Eliminar" aria-label="Eliminar equipo">{I.trash('h-[18px] w-[18px]')}</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {modal && modal.tipo === 'team' && <TeamModal equipo={toEdit} onSave={saveTeam} onClose={() => { setModal(null); setToEdit(null); }} />}
      {modal && modal.tipo === 'import' && <ImportModal existentes={equipos} onImport={importTeams} onClose={() => setModal(null)} />}
      {toDelete && <DeleteModal equipo={toDelete} onCancel={() => setToDelete(null)} onConfirm={deleteTeam} />}
    </div>
  );
}

window.TeamsManager = TeamsManager;
