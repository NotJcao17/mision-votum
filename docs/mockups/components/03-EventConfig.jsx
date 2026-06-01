'use client';
/**
 * Misión Votum · Pantalla 3 — Configuración de Evento
 * Encabezado: volver, nombre editable inline, control de estado (3 opciones).
 * Nav lateral. Secciones en la misma página: Datos Generales + Categorías.
 * Reglas de bloqueo según estado (Activo/Cerrado bloquean rango y categorías).
 * Confirmaciones al cambiar de estado (sección 8 del documento).
 */
const { useState, useRef, useEffect } = React;

// ── Confirmación (modal) ─────────────────────────────────────────
function ConfirmModal({ data, onCancel, onConfirm }) {
  const [text, setText] = useState('');
  useEffect(() => { setText(''); }, [data]);
  if (!data) return null;
  const I = window.MVIcons;
  const fuerte = !!data.requireText;
  const ok = !fuerte || text.trim().toLowerCase() === data.requireText.toLowerCase();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-ivory p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <span className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-full ${fuerte ? 'bg-danger/12 text-danger' : 'bg-saffron/15 text-saffron'}`}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 8v5M12 16.5v.3M10.3 3.9 2.4 18a1.8 1.8 0 0 0 1.6 2.7h16a1.8 1.8 0 0 0 1.6-2.7L13.7 3.9a1.8 1.8 0 0 0-3.4 0Z" /></svg>
          </span>
          <div className="flex-1">
            <h3 className="font-display text-xl font-semibold text-ink">{data.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-inksoft">{data.body}</p>
          </div>
        </div>
        {fuerte && (
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inksoft">
              Escribe <span className="font-bold text-danger">{data.requireText}</span> para confirmar
            </label>
            <input autoFocus value={text} onChange={(e) => setText(e.target.value)}
              className="w-full rounded-lg border border-ink/15 bg-cream/60 px-3 py-2.5 text-sm text-ink outline-none focus:border-danger focus:ring-2 focus:ring-danger/20"
              placeholder={data.requireText} />
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-lg px-4 py-2.5 text-sm font-bold text-inksoft transition hover:bg-ink/5 hover:text-ink">Cancelar</button>
          <button disabled={!ok} onClick={onConfirm}
            className={`rounded-lg px-4 py-2.5 text-sm font-bold text-ivory transition ${data.confirmClass || 'bg-terra hover:bg-terradeep'} disabled:cursor-not-allowed disabled:opacity-40`}>
            {data.confirmLabel || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Selector de estado ───────────────────────────────────────────
function StatusSelector({ estado, onChange }) {
  const opciones = ['Borrador', 'Activo', 'Cerrado'];
  const color = { Borrador: 'bg-inkfaint', Activo: 'bg-olive', Cerrado: 'bg-[#3F5168]' };
  return (
    <div className="inline-flex rounded-xl border border-ink/12 bg-cream/50 p-1">
      {opciones.map((op) => {
        const active = op === estado;
        return (
          <button key={op} onClick={() => onChange(op)}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-bold transition ${active ? 'bg-ivory text-ink shadow-sm ring-1 ring-ink/10' : 'text-inkfaint hover:text-inksoft'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${active ? color[op] : 'bg-current opacity-40'}`} />{op}
          </button>
        );
      })}
    </div>
  );
}

// ── Campo simple ─────────────────────────────────────────────────
function Field({ label, children, hint }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-inksoft">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-inkfaint">{hint}</p>}
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-ink/15 bg-cream/60 px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-inkfaint/70 focus:border-terra focus:bg-cream focus:ring-2 focus:ring-terra/25';

function EventConfig() {
  const I = window.MVIcons;
  const [estado, setEstado] = useState('Borrador');
  const [nombre, setNombre] = useState('Monumentos del Mundo');
  const [editName, setEditName] = useState(false);
  const [fecha, setFecha] = useState('2026-06-20');
  const [desc, setDesc] = useState('Cada equipo recrea y presenta un monumento emblemático de un país. El jurado evalúa fidelidad, creatividad y presentación.');
  const [min, setMin] = useState('1');
  const [max, setMax] = useState('5');
  const [cats, setCats] = useState([
    { id: 1, nombre: 'Fidelidad histórica' },
    { id: 2, nombre: 'Creatividad' },
    { id: 3, nombre: 'Presentación' },
    { id: 4, nombre: 'Trabajo en equipo' },
  ]);
  const [confirm, setConfirm] = useState(null);
  const [saved, setSaved] = useState(false);
  const nameRef = useRef(null);

  const locked = estado === 'Activo' || estado === 'Cerrado';

  useEffect(() => { if (editName && nameRef.current) nameRef.current.focus(); }, [editName]);

  // ── Cambio de estado con confirmaciones (sección 8) ──
  function requestEstado(next) {
    if (next === estado) return;
    if (next === 'Activo' && estado === 'Borrador') {
      if (cats.length === 0) {
        setConfirm({ title: 'Faltan categorías', body: 'Añade al menos una categoría antes de activar el evento. Los jueces necesitan categorías para poder votar.', confirmLabel: 'Entendido', soloAceptar: true });
        return;
      }
      setConfirm({ title: '¿Activar el evento?', body: 'Una vez activo, los jueces podrán votar y no podrás modificar el rango de calificación ni las categorías.', confirmLabel: 'Activar evento', confirmClass: 'bg-olive hover:bg-olive/90', apply: () => setEstado('Activo') });
      return;
    }
    if (next === 'Borrador' && estado === 'Activo') {
      setConfirm({ title: 'Devolver a Borrador', body: 'Esto borrará todos los votos registrados (32 votos). El evento volverá a Borrador y los jueces dejarán de tener acceso.', requireText: 'borrador', confirmLabel: 'Devolver a Borrador', confirmClass: 'bg-danger hover:bg-danger/90', apply: () => setEstado('Borrador') });
      return;
    }
    if (next === 'Cerrado') {
      setConfirm({ title: '¿Cerrar el evento?', body: 'Al cerrar, la votación termina para todos. Podrás ver y exportar los resultados finales, pero los jueces no podrán seguir votando.', confirmLabel: 'Cerrar evento', confirmClass: 'bg-[#3F5168] hover:bg-[#34435a]', apply: () => setEstado('Cerrado') });
      return;
    }
    if (next === 'Activo' && estado === 'Cerrado') {
      setConfirm({ title: 'Reabrir el evento', body: 'El evento volverá a estado Activo y los jueces podrán seguir votando. Los votos actuales se conservan.', confirmLabel: 'Reabrir', confirmClass: 'bg-olive hover:bg-olive/90', apply: () => setEstado('Activo') });
      return;
    }
    setEstado(next);
  }

  function addCat() {
    const id = Math.max(0, ...cats.map((c) => c.id)) + 1;
    setCats([...cats, { id, nombre: '' }]);
  }
  function updateCat(id, val) { setCats(cats.map((c) => (c.id === id ? { ...c, nombre: val } : c))); }
  function removeCat(id) { setCats(cats.filter((c) => c.id !== id)); }

  function doSave() { setSaved(true); setTimeout(() => setSaved(false), 2200); }

  const navItems = [
    { key: 'datos', label: 'Datos generales', icon: I.pencil, active: true },
    { key: 'cats', label: 'Categorías', icon: I.gavel, active: true },
    { key: 'equipos', label: 'Equipos', icon: I.users, link: true },
    { key: 'jueces', label: 'Jueces', icon: I.gavel, link: true },
    { key: 'progreso', label: 'Progreso', icon: I.chevright, link: true, locked: estado === 'Borrador' },
    { key: 'resultados', label: 'Resultados', icon: I.chevright, link: true, locked: estado === 'Borrador' },
  ];

  return (
    <div className="min-h-screen bg-ivory font-body text-ink">
      <window.AdminHeader subtitle="Configuración de evento" />

      {/* ── Encabezado del evento ── */}
      <div className="border-b border-ink/10 bg-cream/30">
        <div className="mx-auto max-w-6xl px-6 py-6 lg:px-10">
          <button className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-inksoft transition hover:text-terra">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            Volver al dashboard
          </button>
          <div className="lg:flex lg:items-end lg:justify-between lg:gap-6">
            <div className="min-w-0">
              {editName ? (
                <input ref={nameRef} value={nombre} onChange={(e) => setNombre(e.target.value)} onBlur={() => setEditName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditName(false)}
                  className="w-full max-w-xl rounded-lg border border-terra/40 bg-ivory px-3 py-1 font-display text-3xl font-semibold leading-tight tracking-tight text-ink outline-none focus:ring-2 focus:ring-terra/25 md:text-4xl" />
              ) : (
                <h1 onClick={() => setEditName(true)} title="Clic para editar el nombre"
                  className="group flex cursor-pointer items-center gap-3 whitespace-nowrap font-display text-3xl font-semibold leading-tight tracking-tight text-ink md:text-4xl">
                  {nombre}
                  <span className="flex-shrink-0 text-inkfaint opacity-0 transition group-hover:opacity-100">{I.pencil('h-5 w-5')}</span>
                </h1>
              )}
            </div>
            <div className="mt-5 flex flex-shrink-0 flex-col items-start gap-2 lg:mt-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-inkfaint">Estado del evento</span>
              <StatusSelector estado={estado} onChange={requestEstado} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Cuerpo: nav + contenido ── */}
      <div className="mx-auto max-w-6xl gap-8 px-6 py-8 lg:grid lg:grid-cols-[210px_1fr] lg:px-10">
        {/* nav lateral */}
        <nav className="mb-6 lg:mb-0">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
            {navItems.map((it) => (
              <li key={it.key}>
                <button disabled={it.locked}
                  className={`flex w-full items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-left text-sm font-bold transition ${
                    it.active ? 'bg-terra/10 text-terra' : it.locked ? 'cursor-not-allowed text-inkfaint/50' : 'text-inksoft hover:bg-ink/5 hover:text-ink'}`}
                  title={it.locked ? 'Disponible cuando el evento esté Activo' : undefined}>
                  <span>{it.label}</span>
                  {it.locked ? (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                  ) : it.link ? <span className="text-inkfaint">{I.chevright('h-4 w-4')}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* contenido */}
        <div className="space-y-8">
          {/* ── Datos generales ── */}
          <section className="rounded-2xl border border-ink/10 bg-cream/30 p-6 lg:p-8">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">Datos generales</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field label="Nombre del evento">
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Fecha">
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <div className="mt-5">
              <Field label="Descripción (opcional)">
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
              </Field>
            </div>
            {/* Rango de calificación */}
            <div className="mt-5">
              <label className="mb-1.5 flex items-center gap-2 whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-inksoft">
                Rango de calificación
                {locked && (
                  <span className="group relative inline-flex">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-inkfaint" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-56 -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-center text-xs font-medium normal-case tracking-normal text-ivory group-hover:block">
                      No se puede modificar mientras el evento está activo.
                    </span>
                  </span>
                )}
              </label>
              <div className="flex items-center gap-3 text-[15px] text-inksoft">
                <span>Del</span>
                <input value={min} onChange={(e) => setMin(e.target.value)} readOnly={locked} inputMode="numeric"
                  className={`w-16 rounded-xl border px-3 py-3 text-center text-[15px] font-bold text-ink outline-none transition ${locked ? 'cursor-not-allowed border-ink/10 bg-ink/5 text-inkfaint' : 'border-ink/15 bg-cream/60 focus:border-terra focus:ring-2 focus:ring-terra/25'}`} />
                <span>al</span>
                <input value={max} onChange={(e) => setMax(e.target.value)} readOnly={locked} inputMode="numeric"
                  className={`w-16 rounded-xl border px-3 py-3 text-center text-[15px] font-bold text-ink outline-none transition ${locked ? 'cursor-not-allowed border-ink/10 bg-ink/5 text-inkfaint' : 'border-ink/15 bg-cream/60 focus:border-terra focus:ring-2 focus:ring-terra/25'}`} />
                <span className="text-inkfaint">· ej. “Del 1 al 5”</span>
              </div>
            </div>
            <div className="mt-7 flex items-center gap-4">
              <button onClick={doSave} className="inline-flex items-center gap-2 rounded-xl bg-terra px-5 py-3 text-[15px] font-bold text-ivory shadow-terra transition hover:bg-terradeep">
                Guardar cambios
              </button>
              {saved && (
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-olive">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  Cambios guardados
                </span>
              )}
            </div>
          </section>

          {/* ── Categorías ── */}
          <section className="rounded-2xl border border-ink/10 bg-cream/30 p-6 lg:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">Categorías</h2>
              <span className="text-sm text-inkfaint">{cats.length} {cats.length === 1 ? 'categoría' : 'categorías'}</span>
            </div>

            {locked && (
              <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-saffron/12 px-4 py-3 text-sm font-medium text-ink">
                <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 flex-shrink-0 text-saffron" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                <span>Las categorías no se pueden modificar mientras el evento está activo.</span>
              </div>
            )}

            {cats.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-ink/20 px-6 py-10 text-center">
                <p className="font-display text-lg font-semibold text-ink">Aún no hay categorías</p>
                <p className="mt-1 text-sm text-inksoft">Añade al menos una antes de activar el evento.</p>
              </div>
            ) : (
              <ul className="mt-6 space-y-2.5">
                {cats.map((c, i) => (
                  <li key={c.id} className="flex items-center gap-3 rounded-xl border border-ink/10 bg-ivory px-4 py-3">
                    <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-terra/10 font-display text-sm font-semibold text-terra">{i + 1}</span>
                    {locked ? (
                      <span className="flex-1 text-[15px] font-medium text-ink">{c.nombre || <em className="text-inkfaint">Sin nombre</em>}</span>
                    ) : (
                      <input value={c.nombre} onChange={(e) => updateCat(c.id, e.target.value)} placeholder="Nombre de la categoría"
                        className="flex-1 bg-transparent text-[15px] font-medium text-ink outline-none placeholder:text-inkfaint/70" />
                    )}
                    {!locked && (
                      <button onClick={() => removeCat(c.id)} className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-inkfaint transition hover:bg-danger/8 hover:text-danger" aria-label="Eliminar categoría" title="Eliminar">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {!locked && (
              <button onClick={addCat} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-terra/40 px-4 py-3 text-sm font-bold text-terra transition hover:border-terra hover:bg-terra/5">
                {I.plus('h-4 w-4')} Añadir categoría
              </button>
            )}
          </section>
        </div>
      </div>

      <ConfirmModal data={confirm} onCancel={() => setConfirm(null)}
        onConfirm={() => { if (confirm && confirm.apply) confirm.apply(); setConfirm(null); }} />
    </div>
  );
}

window.EventConfig = EventConfig;
