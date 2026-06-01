'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge, type EstadoEvento } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog, type ConfirmData } from '@/components/ui/ConfirmDialog';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  UploadIcon,
  CloseIcon,
  CheckIcon,
} from '@/components/ui/icons';
import { createTeam, updateTeam, deleteTeam, importTeams } from './actions';

export interface TeamVM {
  id: string;
  nombre: string;
  votos: number;
}

const inputCls =
  'w-full rounded-xl border border-ink/15 bg-cream/60 px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-inkfaint/70 focus:border-terra focus:bg-cream focus:ring-2 focus:ring-terra/25';

export function TeamsManagerClient({
  eventId,
  eventName,
  estado,
  equipos,
}: {
  eventId: string;
  eventName: string;
  estado: EstadoEvento;
  equipos: TeamVM[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<TeamVM | null>(null);
  const [deleting, setDeleting] = useState<TeamVM | null>(null);
  const [error, setError] = useState('');

  const readOnly = estado === 'Cerrado';

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return equipos;
    return equipos.filter((e) => e.nombre.toLowerCase().includes(q));
  }, [equipos, query]);
  const totalVotos = useMemo(
    () => equipos.reduce((s, e) => s + e.votos, 0),
    [equipos],
  );

  function handleSaveTeam(name: string) {
    setError('');
    startTransition(async () => {
      const res = editing
        ? await updateTeam(editing.id, name)
        : await createTeam(eventId, name);
      if (res.ok) {
        setFormOpen(false);
        setEditing(null);
        router.refresh();
      } else {
        setError(res.error ?? 'No se pudo guardar.');
      }
    });
  }

  function handleImport(names: string[]) {
    setError('');
    startTransition(async () => {
      const res = await importTeams(eventId, names);
      if (res.ok) {
        setImportOpen(false);
        router.refresh();
      } else {
        setError(res.error ?? 'No se pudieron importar los equipos.');
      }
    });
  }

  function handleDelete() {
    if (!deleting) return;
    setError('');
    const id = deleting.id;
    startTransition(async () => {
      const res = await deleteTeam(id);
      if (res.ok) {
        setDeleting(null);
        router.refresh();
      } else {
        setError(res.error ?? 'No se pudo eliminar el equipo.');
        setDeleting(null);
      }
    });
  }

  const deleteData: ConfirmData | null = deleting
    ? {
        title: 'Eliminar equipo',
        body:
          deleting.votos > 0
            ? `Esto eliminará al equipo "${deleting.nombre}" y sus ${deleting.votos} ${deleting.votos === 1 ? 'voto' : 'votos'} registrados.`
            : `Se eliminará al equipo "${deleting.nombre}". No tiene votos registrados.`,
        confirmLabel: 'Eliminar',
        confirmClass: 'bg-danger hover:bg-danger/90',
        requireText: deleting.votos > 0 ? 'eliminar' : undefined,
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
              Equipos · {eventName}
            </h1>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
        {/* Barra de herramientas */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:max-w-xs sm:flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-inkfaint">
              <SearchIcon className="h-[18px] w-[18px]" />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar equipo…"
              className="w-full rounded-xl border border-ink/15 bg-cream/60 py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-inkfaint/70 focus:border-terra focus:bg-cream focus:ring-2 focus:ring-terra/25"
            />
          </div>
          {!readOnly && (
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-terra px-4 py-2.5 text-sm font-bold text-ivory shadow-terra transition hover:bg-terradeep"
              >
                <PlusIcon className="h-4 w-4" /> Añadir equipo
              </button>
              <button
                onClick={() => setImportOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-ink/20 px-4 py-2.5 text-sm font-bold text-ink transition hover:border-terra hover:text-terra"
              >
                <UploadIcon className="h-4 w-4" />
                Importar lote
              </button>
            </div>
          )}
        </div>

        {/* Contador */}
        <p className="mt-5 text-sm text-inksoft">
          <span className="font-bold text-ink">{equipos.length}</span> {equipos.length === 1 ? 'equipo' : 'equipos'} ·{' '}
          <span className="font-bold text-ink">{totalVotos}</span> {totalVotos === 1 ? 'voto' : 'votos'} en total
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

        {/* Lista / estados vacíos */}
        {equipos.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-ink/20 px-6 py-16 text-center">
            <p className="font-display text-xl font-semibold text-ink">Aún no hay equipos</p>
            <p className="mt-1 text-sm text-inksoft">
              {readOnly ? 'Este evento cerrado no tiene equipos registrados.' : 'Añade el primero con el botón de arriba.'}
            </p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-ink/20 px-6 py-12 text-center text-inksoft">
            Sin resultados para “<span className="font-semibold text-ink">{query}</span>”.
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-ink/8 overflow-hidden rounded-2xl border border-ink/10 bg-cream/30">
            {filtrados.map((eq, i) => (
              <li key={eq.id} className="flex items-center gap-4 px-5 py-4 transition hover:bg-cream/60">
                <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-ivory font-display text-sm font-semibold text-inksoft ring-1 ring-ink/10">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-ink">{eq.nombre}</span>
                <span
                  className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                    eq.votos > 0 ? 'bg-olive/12 text-olive' : 'bg-ink/8 text-inkfaint'
                  }`}
                >
                  {eq.votos} {eq.votos === 1 ? 'voto' : 'votos'}
                </span>
                {!readOnly && (
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditing(eq);
                        setFormOpen(true);
                      }}
                      className="grid h-9 w-9 place-items-center rounded-lg text-inksoft transition hover:bg-terra/10 hover:text-terra"
                      title="Editar"
                      aria-label="Editar equipo"
                    >
                      <PencilIcon className="h-[18px] w-[18px]" />
                    </button>
                    <button
                      onClick={() => setDeleting(eq)}
                      className="grid h-9 w-9 place-items-center rounded-lg text-inksoft transition hover:bg-danger/8 hover:text-danger"
                      title="Eliminar"
                      aria-label="Eliminar equipo"
                    >
                      <TrashIcon className="h-[18px] w-[18px]" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>

      {formOpen && (
        <TeamFormModal
          initial={editing}
          busy={pending}
          onSave={handleSaveTeam}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      )}

      {importOpen && (
        <ImportTeamsModal
          existing={equipos.map((e) => e.nombre)}
          busy={pending}
          onImport={handleImport}
          onClose={() => setImportOpen(false)}
        />
      )}

      <ConfirmDialog
        data={deleteData}
        busy={pending}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}

// ── Modal añadir / editar ───────────────────────────────────────────
function TeamFormModal({
  initial,
  busy,
  onSave,
  onClose,
}: {
  initial: TeamVM | null;
  busy: boolean;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const trimmed = nombre.trim();

  return (
    <Modal onClose={onClose}>
      <h3 className="font-display text-2xl font-semibold text-ink">
        {initial ? 'Editar equipo' : 'Añadir equipo'}
      </h3>
      <p className="mt-1 text-sm text-inksoft">
        {initial ? 'Cambia el nombre del equipo.' : 'Crea un nuevo equipo para este evento.'}
      </p>
      <div className="mt-5">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inksoft">
          Nombre del equipo
        </label>
        <input
          ref={ref}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={busy}
          placeholder="ej. Torre Eiffel · Francia"
          className={inputCls}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && trimmed) onSave(trimmed);
          }}
        />
      </div>
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
          onClick={() => onSave(trimmed)}
          className="rounded-lg bg-terra px-4 py-2.5 text-sm font-bold text-ivory transition hover:bg-terradeep disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </Modal>
  );
}

// ── Modal importar lote ─────────────────────────────────────────────
type LineaEstado = 'ok' | 'vacia' | 'existe' | 'dup';
interface LineaImport {
  raw: string;
  val: string;
  estado: LineaEstado;
}

function ImportTeamsModal({
  existing,
  busy,
  onImport,
  onClose,
}: {
  existing: string[];
  busy: boolean;
  onImport: (names: string[]) => void;
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
      if (val === '') return { raw, val, estado: 'vacia' };
      const key = val.toLowerCase();
      if (existSet.has(key)) return { raw, val, estado: 'existe' };
      if (vistos.has(key)) return { raw, val, estado: 'dup' };
      vistos.add(key);
      return { raw, val, estado: 'ok' };
    });
  }, [texto, existSet]);

  const validas = lineas.filter((l) => l.estado === 'ok');
  const errores = lineas.filter(
    (l) => l.estado === 'existe' || l.estado === 'dup',
  );

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-2xl font-semibold text-ink">Importar equipos</h3>
          <p className="mt-1 text-sm text-inksoft">Escribe un nombre de equipo por línea.</p>
        </div>
        <button
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-lg text-inksoft transition hover:bg-ink/5 hover:text-ink"
          aria-label="Cerrar"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inksoft">
            Nombres
          </label>
          <textarea
            ref={ref}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={8}
            disabled={busy}
            placeholder="Un equipo por línea"
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
                const bad = l.estado === 'existe' || l.estado === 'dup';
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
                    <span className="truncate">{l.val}</span>
                    {l.estado === 'existe' && (
                      <span className="ml-auto flex-shrink-0 text-xs font-bold">ya existe</span>
                    )}
                    {l.estado === 'dup' && (
                      <span className="ml-auto flex-shrink-0 text-xs font-bold">duplicado</span>
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
            Se importarán {validas.length} {validas.length === 1 ? 'equipo' : 'equipos'}.
          </span>
          {errores.length > 0 && (
            <span className="ml-2 font-medium text-danger">
              {errores.length} {errores.length === 1 ? 'línea' : 'líneas'} con error se omitirán.
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
            onClick={() => onImport(validas.map((l) => l.val))}
            className="rounded-lg bg-terra px-4 py-2.5 text-sm font-bold text-ivory transition hover:bg-terradeep disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? 'Importando…' : `Importar${validas.length > 0 ? ` ${validas.length}` : ''}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
