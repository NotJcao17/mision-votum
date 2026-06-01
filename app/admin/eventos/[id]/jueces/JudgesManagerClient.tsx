'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge, type EstadoEvento } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog, type ConfirmData } from '@/components/ui/ConfirmDialog';
import { Toast, useToast } from '@/components/ui/Toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  UploadIcon,
  CloseIcon,
  CheckIcon,
  EnvelopeIcon,
  EyeIcon,
  RefreshIcon,
} from '@/components/ui/icons';
import {
  createJudge,
  updateJudge,
  deleteJudge,
  regenerateJudgePassword,
  revealJudgePassword,
  importJudges,
  type ImportEntry,
} from './actions';

export interface JudgeVM {
  id: string;
  nombre: string;
  username: string;
  email: string | null;
  votos: number;
}

const inputCls =
  'w-full rounded-xl border border-ink/15 bg-cream/60 px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-inkfaint/70 focus:border-terra focus:bg-cream focus:ring-2 focus:ring-terra/25';

const REVEAL_MS = 6000;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0]!)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function JudgesManagerClient({
  eventId,
  eventName,
  estado,
  jueces,
}: {
  eventId: string;
  eventName: string;
  estado: EstadoEvento;
  jueces: JudgeVM[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { toast, showToast } = useToast();

  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<JudgeVM | null>(null);
  const [deleting, setDeleting] = useState<JudgeVM | null>(null);
  const [regenTarget, setRegenTarget] = useState<JudgeVM | null>(null);
  const [sendAllOpen, setSendAllOpen] = useState(false);

  // Credenciales recién creadas / regeneradas para mostrar al admin.
  const [credModal, setCredModal] = useState<{
    title: string;
    judge: JudgeVM | { nombre: string; email: string | null };
    username: string;
    password: string;
  } | null>(null);

  // Map { judgeId -> contraseña descifrada } con cierre automático.
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const revealTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [error, setError] = useState('');

  useEffect(
    () => () => {
      Object.values(revealTimers.current).forEach(clearTimeout);
    },
    [],
  );

  const readOnly = estado === 'Cerrado';
  const conEmail = useMemo(() => jueces.filter((j) => j.email).length, [jueces]);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jueces;
    return jueces.filter(
      (j) =>
        j.nombre.toLowerCase().includes(q) ||
        j.username.toLowerCase().includes(q),
    );
  }, [jueces, query]);

  function clearRevealTimer(id: string) {
    const t = revealTimers.current[id];
    if (t) {
      clearTimeout(t);
      delete revealTimers.current[id];
    }
  }

  function handleReveal(j: JudgeVM) {
    if (revealed[j.id]) {
      // Ocultar
      clearRevealTimer(j.id);
      setRevealed((prev) => {
        const next = { ...prev };
        delete next[j.id];
        return next;
      });
      return;
    }
    startTransition(async () => {
      const res = await revealJudgePassword(j.id);
      if (res.ok && res.password) {
        setRevealed((prev) => ({ ...prev, [j.id]: res.password! }));
        clearRevealTimer(j.id);
        revealTimers.current[j.id] = setTimeout(() => {
          setRevealed((prev) => {
            const next = { ...prev };
            delete next[j.id];
            return next;
          });
          delete revealTimers.current[j.id];
        }, REVEAL_MS);
      } else {
        showToast(res.error ?? 'No se pudo revelar la contraseña.', 'info');
      }
    });
  }

  function handleSubmitJudge(name: string, email: string | null) {
    setError('');
    startTransition(async () => {
      if (editing) {
        const res = await updateJudge(editing.id, name, email);
        if (res.ok) {
          setFormOpen(false);
          setEditing(null);
          router.refresh();
        } else {
          setError(res.error ?? 'No se pudo guardar.');
        }
        return;
      }
      const res = await createJudge(eventId, name, email);
      if (res.ok && res.username && res.password) {
        setFormOpen(false);
        setCredModal({
          title: 'Juez añadido',
          judge: { nombre: name.trim(), email: email?.trim() || null },
          username: res.username,
          password: res.password,
        });
        router.refresh();
      } else {
        setError(res.error ?? 'No se pudo crear el juez.');
      }
    });
  }

  function handleDelete() {
    if (!deleting) return;
    const id = deleting.id;
    startTransition(async () => {
      const res = await deleteJudge(id);
      if (res.ok) {
        setDeleting(null);
        router.refresh();
      } else {
        showToast(res.error ?? 'No se pudo eliminar el juez.', 'info');
        setDeleting(null);
      }
    });
  }

  function handleRegenerate() {
    if (!regenTarget) return;
    const target = regenTarget;
    startTransition(async () => {
      const res = await regenerateJudgePassword(target.id);
      if (res.ok && res.password) {
        setRegenTarget(null);
        setCredModal({
          title: 'Contraseña regenerada',
          judge: target,
          username: target.username,
          password: res.password,
        });
        // Si estaba revelada, actualiza la vista al nuevo valor.
        clearRevealTimer(target.id);
        setRevealed((prev) =>
          prev[target.id] ? { ...prev, [target.id]: res.password! } : prev,
        );
        router.refresh();
      } else {
        showToast(res.error ?? 'No se pudo regenerar la contraseña.', 'info');
        setRegenTarget(null);
      }
    });
  }

  function handleImport(entries: ImportEntry[]) {
    startTransition(async () => {
      const res = await importJudges(eventId, entries);
      if (res.ok) {
        setImportOpen(false);
        const n = res.imported ?? 0;
        showToast(`${n} ${n === 1 ? 'juez importado' : 'jueces importados'}`);
        router.refresh();
      } else {
        showToast(res.error ?? 'No se pudieron importar los jueces.', 'info');
      }
    });
  }

  const deleteData: ConfirmData | null = deleting
    ? {
        title: 'Eliminar juez',
        body:
          deleting.votos > 0
            ? `Esto eliminará al juez "${deleting.nombre}" y sus ${deleting.votos} ${deleting.votos === 1 ? 'voto' : 'votos'} registrados.`
            : `Se eliminará al juez "${deleting.nombre}". No tiene votos registrados.`,
        confirmLabel: 'Eliminar',
        confirmClass: 'bg-danger hover:bg-danger/90',
        requireText: deleting.votos > 0 ? 'eliminar' : undefined,
      }
    : null;

  const regenData: ConfirmData | null = regenTarget
    ? {
        title: 'Regenerar contraseña',
        body: `Se generará una nueva contraseña para ${regenTarget.nombre}. La contraseña anterior dejará de funcionar de inmediato. Los votos del juez no se borran.`,
        confirmLabel: 'Regenerar',
        confirmClass: 'bg-terra hover:bg-terradeep',
      }
    : null;

  const sendAllData: ConfirmData | null = sendAllOpen
    ? {
        title: 'Enviar credenciales a todos',
        body: `¿Enviar credenciales a los ${conEmail} ${conEmail === 1 ? 'juez' : 'jueces'} con email registrado? Cada uno recibirá su usuario y contraseña.`,
        confirmLabel: 'Sí, enviar',
        confirmClass: 'bg-terra hover:bg-terradeep',
      }
    : null;

  return (
    <>
      {/* Encabezado del evento */}
      <div className="border-b border-ink/10 bg-cream/30">
        <div className="mx-auto max-w-5xl px-6 py-6 lg:px-10">
          <button
            onClick={() => router.push(`/admin/eventos/${eventId}`)}
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-bold text-inksoft transition hover:text-terra"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Volver a configuración
          </button>
          <div className="flex min-w-0 items-center gap-3">
            <StatusBadge estado={estado} />
            <h1 className="min-w-0 truncate font-display text-3xl font-semibold leading-tight tracking-tight text-ink md:text-4xl">
              Jueces · {eventName}
            </h1>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative lg:max-w-xs lg:flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-inkfaint">
              <SearchIcon className="h-[18px] w-[18px]" />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar juez…"
              className="w-full rounded-xl border border-ink/15 bg-cream/60 py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-inkfaint/70 focus:border-terra focus:bg-cream focus:ring-2 focus:ring-terra/25"
            />
          </div>
          {!readOnly && (
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                  setError('');
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-terra px-4 py-2.5 text-sm font-bold text-ivory shadow-terra transition hover:bg-terradeep"
              >
                <PlusIcon className="h-4 w-4" /> Añadir juez
              </button>
              <button
                onClick={() => setImportOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-ink/20 px-4 py-2.5 text-sm font-bold text-ink transition hover:border-terra hover:text-terra"
              >
                <UploadIcon className="h-4 w-4" />
                Importar lote
              </button>
              <button
                disabled={conEmail === 0}
                onClick={() => setSendAllOpen(true)}
                title={
                  conEmail === 0 ? 'Ningún juez tiene email registrado.' : undefined
                }
                className="inline-flex items-center gap-2 rounded-xl border border-olive/40 bg-olive/10 px-4 py-2.5 text-sm font-bold text-olive transition hover:bg-olive/15 disabled:cursor-not-allowed disabled:border-ink/15 disabled:bg-transparent disabled:text-inkfaint"
              >
                <EnvelopeIcon className="h-4 w-4" /> Enviar credenciales a todos
              </button>
            </div>
          )}
        </div>

        <p className="mt-5 text-sm text-inksoft">
          <span className="font-bold text-ink">{jueces.length}</span> {jueces.length === 1 ? 'juez' : 'jueces'} ·{' '}
          <span className="font-bold text-ink">{conEmail}</span> con email
          {query && (
            <>
              {' '}· {filtrados.length} {filtrados.length === 1 ? 'coincidencia' : 'coincidencias'}
            </>
          )}
        </p>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2.5 text-sm font-medium text-danger" role="alert">
            <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v6M12 16.5v.5" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Lista */}
        {jueces.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-ink/20 px-6 py-16 text-center">
            <p className="font-display text-xl font-semibold text-ink">Aún no hay jueces</p>
            <p className="mt-1 text-sm text-inksoft">
              {readOnly
                ? 'Este evento cerrado no tiene jueces registrados.'
                : 'Añade el primero con el botón de arriba.'}
            </p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-ink/20 px-6 py-12 text-center text-inksoft">
            Sin resultados para “<span className="font-semibold text-ink">{query}</span>”.
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10 bg-cream/30">
            <div className="hidden grid-cols-[1.6fr_1.8fr_1.3fr_auto] gap-4 border-b border-ink/10 px-5 py-3 text-xs font-bold uppercase tracking-wider text-inkfaint md:grid">
              <span>Juez</span>
              <span>Email</span>
              <span>Contraseña</span>
              <span className="text-right">Acciones</span>
            </div>
            <ul className="divide-y divide-ink/8">
              {filtrados.map((j) => (
                <li
                  key={j.id}
                  className="grid grid-cols-1 gap-3 px-5 py-4 transition hover:bg-cream/60 md:grid-cols-[1.6fr_1.8fr_1.3fr_auto] md:items-center md:gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-terra/12 font-body text-sm font-bold text-terra">
                      {initials(j.nombre)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-bold text-ink">{j.nombre}</div>
                      <div className="truncate font-mono text-xs text-inkfaint">@{j.username}</div>
                    </div>
                  </div>
                  <div className="text-sm">
                    {j.email ? (
                      <span className="break-all text-inksoft">{j.email}</span>
                    ) : (
                      <span className="text-inkfaint">—</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-ink">
                      {revealed[j.id] ?? '●●●●●●●●'}
                    </span>
                    <button
                      onClick={() => handleReveal(j)}
                      className="grid h-7 w-7 place-items-center rounded-md text-inkfaint transition hover:bg-ink/5 hover:text-ink"
                      title={revealed[j.id] ? 'Ocultar contraseña' : 'Revelar contraseña'}
                      aria-label={revealed[j.id] ? 'Ocultar contraseña' : 'Revelar contraseña'}
                    >
                      <EyeIcon open={!!revealed[j.id]} className="h-[18px] w-[18px]" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 md:justify-end">
                    {!readOnly && (
                      <button
                        onClick={() =>
                          j.email
                            ? showToast('Disponible en la Fase 10 (envío de emails).', 'info')
                            : undefined
                        }
                        disabled={!j.email}
                        title={
                          j.email
                            ? 'Enviar credenciales'
                            : 'Este juez no tiene email registrado.'
                        }
                        className="grid h-9 w-9 place-items-center rounded-lg text-olive transition hover:bg-olive/10 disabled:cursor-not-allowed disabled:text-inkfaint/40 disabled:hover:bg-transparent"
                        aria-label="Enviar credenciales"
                      >
                        <EnvelopeIcon />
                      </button>
                    )}
                    {!readOnly && (
                      <button
                        onClick={() => setRegenTarget(j)}
                        className="grid h-9 w-9 place-items-center rounded-lg text-inksoft transition hover:bg-saffron/12 hover:text-saffron"
                        title="Regenerar contraseña"
                        aria-label="Regenerar contraseña"
                      >
                        <RefreshIcon />
                      </button>
                    )}
                    {!readOnly && (
                      <button
                        onClick={() => {
                          setEditing(j);
                          setFormOpen(true);
                          setError('');
                        }}
                        className="grid h-9 w-9 place-items-center rounded-lg text-inksoft transition hover:bg-terra/10 hover:text-terra"
                        title="Editar"
                        aria-label="Editar juez"
                      >
                        <PencilIcon className="h-[18px] w-[18px]" />
                      </button>
                    )}
                    {!readOnly && (
                      <button
                        onClick={() => setDeleting(j)}
                        className="grid h-9 w-9 place-items-center rounded-lg text-inksoft transition hover:bg-danger/8 hover:text-danger"
                        title="Eliminar"
                        aria-label="Eliminar juez"
                      >
                        <TrashIcon className="h-[18px] w-[18px]" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {formOpen && (
        <JudgeFormModal
          initial={editing}
          busy={pending}
          formError={error}
          onSubmit={handleSubmitJudge}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
            setError('');
          }}
        />
      )}

      {importOpen && (
        <ImportJudgesModal
          existing={jueces.map((j) => j.nombre)}
          busy={pending}
          onImport={handleImport}
          onClose={() => setImportOpen(false)}
        />
      )}

      {credModal && (
        <CredentialsModal
          title={credModal.title}
          name={credModal.judge.nombre}
          email={credModal.judge.email}
          username={credModal.username}
          password={credModal.password}
          onClose={() => setCredModal(null)}
        />
      )}

      <ConfirmDialog
        data={deleteData}
        busy={pending}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        data={regenData}
        busy={pending}
        onCancel={() => setRegenTarget(null)}
        onConfirm={handleRegenerate}
      />

      <ConfirmDialog
        data={sendAllData}
        busy={pending}
        onCancel={() => setSendAllOpen(false)}
        onConfirm={() => {
          setSendAllOpen(false);
          showToast('Disponible en la Fase 10 (envío de emails).', 'info');
        }}
      />

      <Toast toast={toast} />
    </>
  );
}

// ── Modal añadir/editar ─────────────────────────────────────────────
function JudgeFormModal({
  initial,
  busy,
  formError,
  onSubmit,
  onClose,
}: {
  initial: JudgeVM | null;
  busy: boolean;
  formError: string;
  onSubmit: (name: string, email: string | null) => void;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const trimmed = nombre.trim();

  return (
    <Modal onClose={onClose}>
      <h3 className="font-display text-2xl font-semibold text-ink">
        {initial ? 'Editar juez' : 'Añadir juez'}
      </h3>
      <p className="mt-1 text-sm text-inksoft">
        {initial
          ? 'Actualiza el nombre o el email.'
          : 'El sistema asignará usuario y contraseña automáticamente.'}
      </p>
      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inksoft">
            Nombre completo
          </label>
          <input
            ref={ref}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={busy}
            placeholder="ej. Juan Pérez"
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inksoft">
            Email{' '}
            <span className="font-normal normal-case tracking-normal text-inkfaint">
              (opcional)
            </span>
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            placeholder="juan@colegio.edu"
            className={inputCls}
          />
        </div>
      </div>
      {formError && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2.5 text-sm font-medium text-danger" role="alert">
          <span>{formError}</span>
        </div>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={busy}
          className="rounded-lg px-4 py-2.5 text-sm font-bold text-inksoft transition hover:bg-ink/5 hover:text-ink disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          disabled={!trimmed || busy}
          onClick={() => onSubmit(trimmed, email)}
          className="rounded-lg bg-terra px-4 py-2.5 text-sm font-bold text-ivory transition hover:bg-terradeep disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </Modal>
  );
}

// ── Modal de credenciales (creación / regeneración) ─────────────────
function CredentialsModal({
  title,
  name,
  email,
  username,
  password,
  onClose,
}: {
  title: string;
  name: string;
  email: string | null;
  username: string;
  password: string;
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-olive/12 text-olive">
          <CheckIcon className="h-6 w-6" />
        </span>
        <h3 className="mt-4 font-display text-2xl font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-sm text-inksoft">
          Credenciales para <span className="font-bold text-ink">{name}</span>:
        </p>
      </div>
      <div className="mt-5 space-y-2.5 rounded-xl border border-ink/12 bg-cream/40 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-inksoft">Usuario</span>
          <span className="font-mono text-sm font-bold text-ink">{username}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-inksoft">Contraseña</span>
          <span className="font-mono text-sm font-bold text-ink">{password}</span>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-inkfaint">
        {email
          ? 'Anótalas o envíaselas por email desde la lista.'
          : 'Sin email: comparte estas credenciales manualmente.'}
      </p>
      <button
        onClick={onClose}
        className="mt-5 w-full rounded-xl bg-terra py-3 text-sm font-bold text-ivory transition hover:bg-terradeep"
      >
        Entendido
      </button>
    </Modal>
  );
}

// ── Modal importar ──────────────────────────────────────────────────
type LineaEstado = 'ok' | 'vacia' | 'formato' | 'email' | 'dup';
interface LineaImport {
  raw: string;
  nombre: string;
  email: string;
  estado: LineaEstado;
}

const EMAIL_PREVIEW_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ImportJudgesModal({
  existing,
  busy,
  onImport,
  onClose,
}: {
  existing: string[];
  busy: boolean;
  onImport: (entries: ImportEntry[]) => void;
  onClose: () => void;
}) {
  const [texto, setTexto] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const existSet = useMemo(
    () => new Set(existing.map((n) => n.trim().toLowerCase())),
    [existing],
  );

  const lineas: LineaImport[] = useMemo(() => {
    const vistos = new Set<string>();
    return texto.split('\n').map((raw): LineaImport => {
      const val = raw.trim();
      if (val === '') return { raw, nombre: '', email: '', estado: 'vacia' };
      const parts = val.split(',');
      const nombre = (parts[0] ?? '').trim();
      const email = (parts[1] ?? '').trim();
      if (!nombre || /[@]/.test(nombre) || parts.length > 2) {
        return { raw, nombre, email, estado: 'formato' };
      }
      if (email && !EMAIL_PREVIEW_RE.test(email)) {
        return { raw, nombre, email, estado: 'email' };
      }
      const key = nombre.toLowerCase();
      if (existSet.has(key) || vistos.has(key)) {
        return { raw, nombre, email, estado: 'dup' };
      }
      vistos.add(key);
      return { raw, nombre, email, estado: 'ok' };
    });
  }, [texto, existSet]);

  const validas = lineas.filter((l) => l.estado === 'ok');
  const errores = lineas.filter(
    (l) => l.estado !== 'ok' && l.estado !== 'vacia',
  );
  const etiqueta: Record<Exclude<LineaEstado, 'ok' | 'vacia'>, string> = {
    formato: 'formato inválido',
    email: 'email inválido',
    dup: 'duplicado',
  };

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-2xl font-semibold text-ink">Importar jueces</h3>
          <p className="mt-1 text-sm text-inksoft">
            Una entrada por línea. Formato:{' '}
            <span className="font-semibold text-ink">Nombre, email</span> (el email es opcional).
          </p>
          <p className="mt-1.5 inline-block rounded-md bg-cream/60 px-2 py-1 font-mono text-xs text-inksoft">
            Juan Pérez, juan@colegio.edu
          </p>
        </div>
        <button
          onClick={onClose}
          className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg text-inksoft transition hover:bg-ink/5 hover:text-ink"
          aria-label="Cerrar"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inksoft">
            Entradas
          </label>
          <textarea
            ref={ref}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={8}
            disabled={busy}
            placeholder="Juan Pérez, juan@colegio.edu"
            spellCheck={false}
            className={`${inputCls} resize-none font-mono text-sm leading-relaxed`}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inksoft">
            Vista previa
          </label>
          <div className="h-[calc(8*1.625em+1.5rem)] overflow-y-auto rounded-xl border border-ink/12 bg-cream/40 p-3">
            {lineas.length === 0 || lineas.every((l) => l.estado === 'vacia') ? (
              <p className="text-sm text-inkfaint">La vista previa aparecerá aquí.</p>
            ) : (
              lineas.map((l, i) => {
                if (l.estado === 'vacia') return <div key={i} className="h-[1.625em]" />;
                const bad = l.estado !== 'ok';
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2 rounded px-1.5 py-0.5 text-sm leading-relaxed ${
                      bad ? 'bg-danger/10 text-danger' : 'text-ink'
                    }`}
                  >
                    {bad ? (
                      <CloseIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    ) : (
                      <CheckIcon className="h-3.5 w-3.5 flex-shrink-0 text-olive" />
                    )}
                    <span className="truncate">
                      {l.nombre || l.raw.trim()}
                      {!bad && l.email && <span className="text-inkfaint"> · {l.email}</span>}
                    </span>
                    {bad && (
                      <span className="ml-auto flex-shrink-0 text-xs font-bold">
                        {etiqueta[l.estado as Exclude<LineaEstado, 'ok' | 'vacia'>]}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          <span className="font-bold text-ink">
            Se importarán {validas.length} {validas.length === 1 ? 'juez' : 'jueces'}.
          </span>
          {errores.length > 0 && (
            <span className="ml-2 font-medium text-danger">
              {errores.length} con error se omitirán.
            </span>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="rounded-lg px-4 py-2.5 text-sm font-bold text-inksoft transition hover:bg-ink/5 hover:text-ink disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            disabled={validas.length === 0 || busy}
            onClick={() =>
              onImport(
                validas.map((l) => ({ name: l.nombre, email: l.email || null })),
              )
            }
            className="rounded-lg bg-terra px-4 py-2.5 text-sm font-bold text-ivory transition hover:bg-terradeep disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? 'Importando…' : `Importar${validas.length > 0 ? ` ${validas.length}` : ''}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
