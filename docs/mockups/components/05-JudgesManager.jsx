'use client';
/**
 * Misión Votum · Pantalla 5 — Gestión de Jueces
 * Credenciales (username + contraseña revelable) · enviar credenciales
 * (individual con toast + a todos con confirmación) · añadir/editar/importar/eliminar.
 */
const { useState, useMemo, useEffect, useRef } = React;

const JUECES_SEED = [
  { id: 1, nombre: 'María López',   user: 'mlopez',    email: 'maria.lopez@colegio.edu',   pass: 'Votum-7421', votos: 12 },
  { id: 2, nombre: 'Javier Ríos',   user: 'jrios',     email: 'javier.rios@colegio.edu',   pass: 'Votum-3098', votos: 9 },
  { id: 3, nombre: 'Ana Duarte',    user: 'aduarte',   email: 'ana.duarte@colegio.edu',    pass: 'Votum-5512', votos: 8 },
  { id: 4, nombre: 'Takeshi Mori',  user: 'tmori',     email: '',                          pass: 'Votum-8830', votos: 0 },
  { id: 5, nombre: 'Sofía Paz',     user: 'spaz',      email: 'sofia.paz@colegio.edu',     pass: 'Votum-2261', votos: 4 },
  { id: 6, nombre: 'Rafael Bravo',  user: 'rbravo',    email: '',                          pass: 'Votum-1747', votos: 0 },
];

const inputCls5 = 'w-full rounded-xl border border-ink/15 bg-cream/60 px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-inkfaint/70 focus:border-terra focus:bg-cream focus:ring-2 focus:ring-terra/25';

function Modal({ children, onClose, max = 'max-w-md' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-6 backdrop-blur-sm" onClick={onClose}>
      <div className={`w-full ${max} rounded-2xl border border-ink/10 bg-ivory p-6 shadow-2xl`} onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

// ── Iconos locales ───────────────────────────────────────────────
const EnvelopeIcon = (c = 'h-[18px] w-[18px]') => (<svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m3.5 6.5 8.5 6 8.5-6" /></svg>);
const EyeIcon5 = (open) => open
  ? (<svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>)
  : (<svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18M10.6 5.2A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.3 4.1M6.5 6.6A17.4 17.4 0 0 0 2 12s3.5 7 10 7a10.4 10.4 0 0 0 4-.8M9.9 9.9A3 3 0 0 0 14 14" /></svg>);

// ── Toast ────────────────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 animate-[fadein_.2s_ease]">
      <div className="flex items-center gap-2.5 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-ivory shadow-2xl">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-olive">
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        </span>
        {msg}
      </div>
    </div>
  );
}

// ── Modal añadir/editar juez ─────────────────────────────────────
function JudgeModal({ juez, onSave, onClose }) {
  const [nombre, setNombre] = useState(juez ? juez.nombre : '');
  const [email, setEmail] = useState(juez ? juez.email : '');
  const [assigned, setAssigned] = useState(null);
  const ref = useRef(null);
  useEffect(() => { ref.current && ref.current.focus(); }, []);

  function guardar() {
    if (!nombre.trim()) return;
    if (juez) { onSave({ ...juez, nombre: nombre.trim(), email: email.trim() }); return; }
    // nuevo: el sistema asigna username + contraseña → mostrar confirmación
    const user = nombre.trim().toLowerCase().split(/\s+/).map((p, i) => i === 0 ? p[0] : p).join('').replace(/[^a-z]/g, '').slice(0, 10) || 'juez';
    const pass = 'Votum-' + Math.floor(1000 + Math.random() * 9000);
    setAssigned({ user, pass, nombre: nombre.trim(), email: email.trim() });
  }

  if (assigned) {
    return (
      <Modal onClose={onClose}>
        <div className="flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-olive/12 text-olive">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </span>
          <h3 className="mt-4 font-display text-2xl font-semibold text-ink">Juez añadido</h3>
          <p className="mt-1 text-sm text-inksoft">Se asignaron estas credenciales a <span className="font-bold text-ink">{assigned.nombre}</span>:</p>
        </div>
        <div className="mt-5 space-y-2.5 rounded-xl border border-ink/12 bg-cream/40 p-4">
          <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-inksoft">Usuario</span><span className="font-mono text-sm font-bold text-ink">{assigned.user}</span></div>
          <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-inksoft">Contraseña</span><span className="font-mono text-sm font-bold text-ink">{assigned.pass}</span></div>
        </div>
        <p className="mt-3 text-center text-xs text-inkfaint">{assigned.email ? 'Puedes enviar las credenciales por email desde la lista.' : 'Sin email: comparte estas credenciales manualmente.'}</p>
        <button onClick={() => { onSave({ id: Date.now(), nombre: assigned.nombre, email: assigned.email, user: assigned.user, pass: assigned.pass, votos: 0 }); }}
          className="mt-5 w-full rounded-xl bg-terra py-3 text-sm font-bold text-ivory transition hover:bg-terradeep">Entendido</button>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="font-display text-2xl font-semibold text-ink">{juez ? 'Editar juez' : 'Añadir juez'}</h3>
      <p className="mt-1 text-sm text-inksoft">{juez ? 'Actualiza el nombre o el email.' : 'El sistema asignará usuario y contraseña automáticamente.'}</p>
      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inksoft">Nombre completo</label>
          <input ref={ref} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="ej. Juan Pérez" className={inputCls5} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inksoft">Email <span className="font-normal normal-case tracking-normal text-inkfaint">(opcional)</span></label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="juan@colegio.edu" className={inputCls5} />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-bold text-inksoft transition hover:bg-ink/5 hover:text-ink">Cancelar</button>
        <button disabled={!nombre.trim()} onClick={guardar} className="rounded-lg bg-terra px-4 py-2.5 text-sm font-bold text-ivory transition hover:bg-terradeep disabled:cursor-not-allowed disabled:opacity-40">Guardar</button>
      </div>
    </Modal>
  );
}

// ── Modal importar jueces ────────────────────────────────────────
function ImportJudgesModal({ existentes, onImport, onClose }) {
  const [texto, setTexto] = useState('Carlos Núñez, carlos.nunez@colegio.edu\nElena Vargas, elena.vargas@colegio.edu\nPedro Salas\nLínea sin formato válido @@@\nLucía Font, lucia.font@colegio.edu');
  const ref = useRef(null);
  useEffect(() => { ref.current && ref.current.focus(); }, []);
  const userSet = useMemo(() => new Set(existentes.map((e) => e.nombre.trim().toLowerCase())), [existentes]);

  const lineas = useMemo(() => {
    const vistos = new Set();
    return texto.split('\n').map((raw) => {
      const val = raw.trim();
      if (val === '') return { raw, estado: 'vacia' };
      const parts = val.split(',');
      const nombre = (parts[0] || '').trim();
      const email = (parts[1] || '').trim();
      let estado = 'ok';
      if (!nombre || /[@]/.test(nombre) || parts.length > 2) estado = 'formato';
      else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) estado = 'email';
      else if (userSet.has(nombre.toLowerCase()) || vistos.has(nombre.toLowerCase())) estado = 'dup';
      else vistos.add(nombre.toLowerCase());
      return { raw, nombre, email, estado };
    });
  }, [texto, userSet]);

  const validas = lineas.filter((l) => l.estado === 'ok');
  const errores = lineas.filter((l) => l.estado && !['ok', 'vacia'].includes(l.estado));
  const etiqueta = { formato: 'formato inválido', email: 'email inválido', dup: 'duplicado' };

  return (
    <Modal onClose={onClose} max="max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-2xl font-semibold text-ink">Importar jueces</h3>
          <p className="mt-1 text-sm text-inksoft">Una entrada por línea. Formato: <span className="font-semibold text-ink">Nombre, email</span> (el email es opcional).</p>
          <p className="mt-1.5 inline-block rounded-md bg-cream/60 px-2 py-1 font-mono text-xs text-inksoft">Juan Pérez, juan@colegio.edu</p>
        </div>
        <button onClick={onClose} className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg text-inksoft transition hover:bg-ink/5 hover:text-ink" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inksoft">Entradas</label>
          <textarea ref={ref} value={texto} onChange={(e) => setTexto(e.target.value)} rows={7} className={`${inputCls5} resize-none font-mono text-sm leading-relaxed`} spellCheck={false} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inksoft">Vista previa</label>
          <div className="h-[calc(7*1.625em+1.5rem)] overflow-y-auto rounded-xl border border-ink/12 bg-cream/40 p-3">
            {lineas.map((l, i) => {
              if (l.estado === 'vacia') return <div key={i} className="h-[1.625em]" />;
              const bad = etiqueta[l.estado];
              return (
                <div key={i} className={`flex items-center gap-2 rounded px-1.5 py-0.5 text-sm leading-relaxed ${bad ? 'bg-danger/10 text-danger' : 'text-ink'}`}>
                  {bad
                    ? <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    : <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 flex-shrink-0 text-olive" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                  <span className="truncate">{l.nombre || l.raw.trim()}{!bad && l.email && <span className="text-inkfaint"> · {l.email}</span>}</span>
                  {bad && <span className="ml-auto flex-shrink-0 text-xs font-bold">{bad}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          <span className="font-bold text-ink">Se importarán {validas.length} {validas.length === 1 ? 'juez' : 'jueces'}.</span>
          {errores.length > 0 && <span className="ml-2 font-medium text-danger">{errores.length} con error se omitirán.</span>}
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-bold text-inksoft transition hover:bg-ink/5 hover:text-ink">Cancelar</button>
          <button disabled={validas.length === 0} onClick={() => onImport(validas)} className="rounded-lg bg-terra px-4 py-2.5 text-sm font-bold text-ivory transition hover:bg-terradeep disabled:cursor-not-allowed disabled:opacity-40">Importar {validas.length || ''}</button>
        </div>
      </div>
    </Modal>
  );
}

// ── Confirmaciones ───────────────────────────────────────────────
function DeleteJudgeModal({ juez, onCancel, onConfirm }) {
  const [text, setText] = useState('');
  const fuerte = juez.votos > 0;
  const ok = !fuerte || text.trim().toLowerCase() === 'eliminar';
  return (
    <Modal onClose={onCancel}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-danger/12 text-danger"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 8v5M12 16.5v.3M10.3 3.9 2.4 18a1.8 1.8 0 0 0 1.6 2.7h16a1.8 1.8 0 0 0 1.6-2.7L13.7 3.9a1.8 1.8 0 0 0-3.4 0Z" /></svg></span>
        <div className="flex-1">
          <h3 className="font-display text-xl font-semibold text-ink">Eliminar juez</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-inksoft">
            {fuerte ? <>Esto eliminará al juez <span className="font-bold text-ink">{juez.nombre}</span> y sus <span className="font-bold text-ink">{juez.votos} votos</span>.</>
                    : <>Se eliminará al juez <span className="font-bold text-ink">{juez.nombre}</span>. No tiene votos registrados.</>}
          </p>
        </div>
      </div>
      {fuerte && (
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inksoft">Escribe <span className="font-bold text-danger">eliminar</span> para confirmar</label>
          <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="eliminar" className="w-full rounded-lg border border-ink/15 bg-cream/60 px-3 py-2.5 text-sm text-ink outline-none focus:border-danger focus:ring-2 focus:ring-danger/20" />
        </div>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onCancel} className="rounded-lg px-4 py-2.5 text-sm font-bold text-inksoft transition hover:bg-ink/5 hover:text-ink">Cancelar</button>
        <button disabled={!ok} onClick={onConfirm} className="rounded-lg bg-danger px-4 py-2.5 text-sm font-bold text-ivory transition hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-40">Eliminar</button>
      </div>
    </Modal>
  );
}

function SendAllModal({ count, onCancel, onConfirm }) {
  return (
    <Modal onClose={onCancel}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-terra/12 text-terra">{EnvelopeIcon('h-5 w-5')}</span>
        <div className="flex-1">
          <h3 className="font-display text-xl font-semibold text-ink">Enviar credenciales a todos</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-inksoft">¿Enviar credenciales a los <span className="font-bold text-ink">{count} jueces</span> con email registrado? Cada uno recibirá su usuario y contraseña.</p>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onCancel} className="rounded-lg px-4 py-2.5 text-sm font-bold text-inksoft transition hover:bg-ink/5 hover:text-ink">Cancelar</button>
        <button onClick={onConfirm} className="rounded-lg bg-terra px-4 py-2.5 text-sm font-bold text-ivory transition hover:bg-terradeep">Sí, enviar</button>
      </div>
    </Modal>
  );
}

function JudgesManager() {
  const I = window.MVIcons;
  const [jueces, setJueces] = useState(JUECES_SEED);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState({ tipo: 'import' }); // import visible por defecto (demo)
  const [toEdit, setToEdit] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [sendAll, setSendAll] = useState(false);
  const [revealed, setRevealed] = useState(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  const filtrados = useMemo(() => jueces.filter((j) =>
    j.nombre.toLowerCase().includes(query.trim().toLowerCase()) || j.user.toLowerCase().includes(query.trim().toLowerCase())
  ), [jueces, query]);
  const conEmail = jueces.filter((j) => j.email).length;

  function showToast(msg) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2600);
  }
  function reveal(id) {
    setRevealed(id);
    setTimeout(() => setRevealed((cur) => (cur === id ? null : cur)), 2500);
  }
  function saveJudge(j) {
    setJueces((prev) => prev.some((x) => x.id === j.id) ? prev.map((x) => x.id === j.id ? j : x) : [...prev, j]);
    setModal(null); setToEdit(null);
  }
  function importJudges(list) {
    const base = Math.max(0, ...jueces.map((j) => j.id));
    setJueces([...jueces, ...list.map((l, i) => {
      const user = l.nombre.toLowerCase().split(/\s+/).map((p, k) => k === 0 ? p[0] : p).join('').replace(/[^a-z]/g, '').slice(0, 10);
      return { id: base + i + 1, nombre: l.nombre, email: l.email, user, pass: 'Votum-' + Math.floor(1000 + Math.random() * 9000), votos: 0 };
    })]);
    setModal(null);
    showToast(`${list.length} ${list.length === 1 ? 'juez importado' : 'jueces importados'}`);
  }

  return (
    <div className="min-h-screen bg-ivory font-body text-ink">
      <window.AdminHeader subtitle="Gestión de jueces" />

      <div className="border-b border-ink/10 bg-cream/30">
        <div className="mx-auto max-w-5xl px-6 py-6 lg:px-10">
          <button className="mb-3 inline-flex items-center gap-1.5 text-sm font-bold text-inksoft transition hover:text-terra">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            Volver a configuración
          </button>
          <div className="flex min-w-0 items-center gap-3">
            <window.StatusBadge estado="Activo" />
            <h1 className="min-w-0 truncate font-display text-3xl font-semibold leading-tight tracking-tight text-ink md:text-4xl">Jueces · Monumentos del Mundo</h1>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
        {/* toolbar */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative lg:max-w-xs lg:flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-inkfaint"><svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg></span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar juez…" className="w-full rounded-xl border border-ink/15 bg-cream/60 py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-inkfaint/70 focus:border-terra focus:bg-cream focus:ring-2 focus:ring-terra/25" />
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button onClick={() => { setToEdit(null); setModal({ tipo: 'judge' }); }} className="inline-flex items-center gap-2 rounded-xl bg-terra px-4 py-2.5 text-sm font-bold text-ivory shadow-terra transition hover:bg-terradeep">{I.plus('h-4 w-4')} Añadir juez</button>
            <button onClick={() => setModal({ tipo: 'import' })} className="inline-flex items-center gap-2 rounded-xl border border-ink/20 px-4 py-2.5 text-sm font-bold text-ink transition hover:border-terra hover:text-terra"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg> Importar lote</button>
            <button onClick={() => conEmail > 0 && setSendAll(true)} disabled={conEmail === 0} title={conEmail === 0 ? 'Ningún juez tiene email registrado.' : undefined}
              className="inline-flex items-center gap-2 rounded-xl border border-olive/40 bg-olive/10 px-4 py-2.5 text-sm font-bold text-olive transition hover:bg-olive/15 disabled:cursor-not-allowed disabled:border-ink/15 disabled:bg-transparent disabled:text-inkfaint">
              {EnvelopeIcon('h-4 w-4')} Enviar credenciales a todos
            </button>
          </div>
        </div>

        <p className="mt-5 text-sm text-inksoft"><span className="font-bold text-ink">{jueces.length}</span> jueces · <span className="font-bold text-ink">{conEmail}</span> con email{query && <> · {filtrados.length} {filtrados.length === 1 ? 'coincidencia' : 'coincidencias'}</>}</p>

        {/* lista */}
        {jueces.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-ink/20 px-6 py-16 text-center">
            <p className="font-display text-xl font-semibold text-ink">Aún no hay jueces</p>
            <p className="mt-1 text-sm text-inksoft">Añade el primero con el botón de arriba.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10 bg-cream/30">
            {/* encabezado de columnas (desktop) */}
            <div className="hidden grid-cols-[1.6fr_1.8fr_1.3fr_auto] gap-4 border-b border-ink/10 px-5 py-3 text-xs font-bold uppercase tracking-wider text-inkfaint md:grid">
              <span>Juez</span><span>Email</span><span>Contraseña</span><span className="text-right">Acciones</span>
            </div>
            <ul className="divide-y divide-ink/8">
              {filtrados.map((j) => (
                <li key={j.id} className="grid grid-cols-1 gap-3 px-5 py-4 transition hover:bg-cream/60 md:grid-cols-[1.6fr_1.8fr_1.3fr_auto] md:items-center md:gap-4">
                  {/* nombre + user */}
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-terra/12 font-body text-sm font-bold text-terra">{j.nombre.split(' ').map((p) => p[0]).slice(0, 2).join('')}</span>
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-bold text-ink">{j.nombre}</div>
                      <div className="truncate font-mono text-xs text-inkfaint">@{j.user}</div>
                    </div>
                  </div>
                  {/* email */}
                  <div className="text-sm">
                    {j.email ? <span className="break-all text-inksoft">{j.email}</span> : <span className="text-inkfaint">—</span>}
                  </div>
                  {/* password */}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-ink">{revealed === j.id ? j.pass : '●●●●●●●'}</span>
                    <button onClick={() => reveal(j.id)} className="grid h-7 w-7 place-items-center rounded-md text-inkfaint transition hover:bg-ink/5 hover:text-ink" title="Revelar contraseña" aria-label="Revelar contraseña">{EyeIcon5(revealed === j.id)}</button>
                  </div>
                  {/* acciones */}
                  <div className="flex items-center gap-1.5 md:justify-end">
                    <button onClick={() => j.email && showToast(`Credenciales enviadas a ${j.email}`)} disabled={!j.email}
                      title={j.email ? 'Enviar credenciales' : 'Este juez no tiene email registrado.'}
                      className="grid h-9 w-9 place-items-center rounded-lg text-olive transition hover:bg-olive/10 disabled:cursor-not-allowed disabled:text-inkfaint/40 disabled:hover:bg-transparent" aria-label="Enviar credenciales">{EnvelopeIcon()}</button>
                    <button onClick={() => { setToEdit(j); setModal({ tipo: 'judge' }); }} className="grid h-9 w-9 place-items-center rounded-lg text-inksoft transition hover:bg-terra/10 hover:text-terra" title="Editar" aria-label="Editar">{I.pencil('h-[18px] w-[18px]')}</button>
                    <button onClick={() => setToDelete(j)} className="grid h-9 w-9 place-items-center rounded-lg text-inksoft transition hover:bg-danger/8 hover:text-danger" title="Eliminar" aria-label="Eliminar">{I.trash('h-[18px] w-[18px]')}</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {modal && modal.tipo === 'judge' && <JudgeModal juez={toEdit} onSave={saveJudge} onClose={() => { setModal(null); setToEdit(null); }} />}
      {modal && modal.tipo === 'import' && <ImportJudgesModal existentes={jueces} onImport={importJudges} onClose={() => setModal(null)} />}
      {toDelete && <DeleteJudgeModal juez={toDelete} onCancel={() => setToDelete(null)} onConfirm={() => { setJueces(jueces.filter((x) => x.id !== toDelete.id)); setToDelete(null); }} />}
      {sendAll && <SendAllModal count={conEmail} onCancel={() => setSendAll(false)} onConfirm={() => { setSendAll(false); showToast(`Credenciales enviadas a ${conEmail} jueces`); }} />}
      <Toast msg={toast} />
    </div>
  );
}

window.JudgesManager = JudgesManager;
