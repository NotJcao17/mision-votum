'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { StatusSelector } from '@/components/ui/StatusSelector';
import { ConfirmDialog, type ConfirmData } from '@/components/ui/ConfirmDialog';
import type { EstadoEvento } from '@/components/ui/StatusBadge';
import {
  PencilIcon,
  PlusIcon,
  LockIcon,
  CloseIcon,
  CheckIcon,
} from '@/components/ui/icons';
import { labelToStatus } from '@/lib/events';
import {
  updateEvent,
  setEventStatus,
  addCategory,
  updateCategory,
  deleteCategory,
} from '../../actions';

interface CategoriaVM {
  id: string;
  nombre: string;
}

interface EventoVM {
  id: string;
  nombre: string;
  descripcion: string;
  fecha: string;
  minScore: number;
  maxScore: number;
  estado: EstadoEvento;
  votos: number;
  categorias: CategoriaVM[];
}

const inputCls =
  'w-full rounded-xl border border-ink/15 bg-cream/60 px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-inkfaint/70 focus:border-terra focus:bg-cream focus:ring-2 focus:ring-terra/25';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-inksoft">
        {label}
      </label>
      {children}
    </div>
  );
}

export function EventConfigClient({ evento }: { evento: EventoVM }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [estado, setEstado] = useState<EstadoEvento>(evento.estado);
  const [nombre, setNombre] = useState(evento.nombre);
  const [editName, setEditName] = useState(false);
  const [fecha, setFecha] = useState(evento.fecha);
  const [desc, setDesc] = useState(evento.descripcion);
  const [min, setMin] = useState(String(evento.minScore));
  const [max, setMax] = useState(String(evento.maxScore));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [categorias, setCategorias] = useState<CategoriaVM[]>(evento.categorias);
  const [catError, setCatError] = useState('');

  const [confirm, setConfirm] = useState<ConfirmData | null>(null);
  const [pendingStatus, setPendingStatus] = useState<EstadoEvento | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const locked = estado === 'Activo' || estado === 'Cerrado';

  useEffect(() => {
    if (editName && nameRef.current) nameRef.current.focus();
  }, [editName]);

  function doSave() {
    setError('');
    startTransition(async () => {
      const res = await updateEvent(evento.id, {
        name: nombre,
        eventDate: fecha || null,
        description: desc || null,
        minScore: Number(min),
        maxScore: Number(max),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2200);
        router.refresh();
      } else {
        setError(res.error ?? 'No se pudo guardar.');
      }
    });
  }

  // ── Categorías ────────────────────────────────────────────────
  function handleAddCategory() {
    setCatError('');
    startTransition(async () => {
      const res = await addCategory(evento.id);
      if (res.ok && res.category) {
        setCategorias((prev) => [...prev, res.category!]);
        router.refresh();
      } else {
        setCatError(res.error ?? 'No se pudo añadir la categoría.');
      }
    });
  }

  function handleCategoryChange(id: string, nombre: string) {
    setCategorias((prev) => prev.map((c) => (c.id === id ? { ...c, nombre } : c)));
  }

  function handleCategoryCommit(id: string, prevValue: string) {
    const current = categorias.find((c) => c.id === id);
    if (!current) return;
    const trimmed = current.nombre.trim();
    if (!trimmed) {
      // Revertir si quedó vacío.
      setCategorias((prev) =>
        prev.map((c) => (c.id === id ? { ...c, nombre: prevValue } : c)),
      );
      return;
    }
    if (trimmed === prevValue) return;
    startTransition(async () => {
      const res = await updateCategory(id, trimmed);
      if (!res.ok) {
        setCatError(res.error ?? 'No se pudo actualizar la categoría.');
        setCategorias((prev) =>
          prev.map((c) => (c.id === id ? { ...c, nombre: prevValue } : c)),
        );
      } else {
        setCatError('');
        router.refresh();
      }
    });
  }

  function handleCategoryDelete(id: string) {
    const prev = categorias;
    setCategorias((p) => p.filter((c) => c.id !== id));
    setCatError('');
    startTransition(async () => {
      const res = await deleteCategory(id);
      if (!res.ok) {
        setCatError(res.error ?? 'No se pudo eliminar la categoría.');
        setCategorias(prev);
      } else {
        router.refresh();
      }
    });
  }

  // ── Transiciones de estado ───────────────────────────────────
  function requestEstado(next: EstadoEvento) {
    if (next === estado) return;
    setError('');

    // Bloqueo de activación sin categorías (aviso informativo).
    if (next === 'Activo' && estado === 'Borrador' && categorias.length === 0) {
      setPendingStatus(null);
      setConfirm({
        title: 'Faltan categorías',
        body: 'Añade al menos una categoría antes de activar el evento. Los jueces necesitan categorías para poder votar.',
        confirmLabel: 'Entendido',
        acceptOnly: true,
      });
      return;
    }

    setPendingStatus(next);

    if (next === 'Activo' && estado === 'Borrador') {
      setConfirm({
        title: '¿Activar el evento?',
        body: 'Una vez activo, los jueces podrán votar y no podrás modificar el rango de calificación ni las categorías.',
        confirmLabel: 'Activar evento',
        confirmClass: 'bg-olive hover:bg-olive/90',
      });
    } else if (next === 'Borrador') {
      setConfirm({
        title: 'Devolver a Borrador',
        body: `Esto borrará todos los votos registrados (${evento.votos} ${evento.votos === 1 ? 'voto' : 'votos'}). El evento volverá a Borrador y los jueces dejarán de tener acceso.`,
        requireText: 'borrador',
        confirmLabel: 'Devolver a Borrador',
        confirmClass: 'bg-danger hover:bg-danger/90',
      });
    } else if (next === 'Cerrado') {
      setConfirm({
        title: '¿Cerrar el evento?',
        body: 'Al cerrar, la votación termina para todos. Podrás ver y exportar los resultados finales, pero los jueces no podrán seguir votando.',
        confirmLabel: 'Cerrar evento',
        confirmClass: 'bg-[#3F5168] hover:bg-[#34435a]',
      });
    } else if (next === 'Activo' && estado === 'Cerrado') {
      setConfirm({
        title: 'Reabrir el evento',
        body: 'El evento volverá a estado Activo y los jueces podrán seguir votando. Los votos actuales se conservan.',
        confirmLabel: 'Reabrir',
        confirmClass: 'bg-olive hover:bg-olive/90',
      });
    }
  }

  function confirmEstado() {
    if (!pendingStatus) {
      // Diálogo informativo (acceptOnly): solo cierra.
      setConfirm(null);
      return;
    }
    const next = pendingStatus;
    startTransition(async () => {
      const res = await setEventStatus(evento.id, labelToStatus(next));
      if (res.ok) {
        setEstado(next);
        setConfirm(null);
        setPendingStatus(null);
        router.refresh();
      } else {
        setError(res.error ?? 'No se pudo cambiar el estado.');
        setConfirm(null);
        setPendingStatus(null);
      }
    });
  }

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const navItems: {
    label: string;
    target?: string;
    href?: string;
    soon?: boolean;
    lockedNav?: boolean;
  }[] = [
    { label: 'Datos generales', target: 'sec-datos' },
    { label: 'Categorías', target: 'sec-categorias' },
    { label: 'Equipos', href: `/admin/eventos/${evento.id}/equipos` },
    { label: 'Jueces', href: `/admin/eventos/${evento.id}/jueces` },
    estado === 'Borrador'
      ? { label: 'Progreso', soon: true, lockedNav: true }
      : { label: 'Progreso', href: `/admin/eventos/${evento.id}/progreso` },
    { label: 'Resultados', soon: true, lockedNav: estado === 'Borrador' },
  ];

  return (
    <>
      {/* Encabezado del evento */}
      <div className="border-b border-ink/10 bg-cream/30">
        <div className="mx-auto max-w-6xl px-6 py-6 lg:px-10">
          <button
            onClick={() => router.push('/admin')}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-inksoft transition hover:text-terra"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Volver al dashboard
          </button>
          <div className="lg:flex lg:items-end lg:justify-between lg:gap-6">
            <div className="min-w-0">
              {editName ? (
                <input
                  ref={nameRef}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  onBlur={() => {
                    setEditName(false);
                    doSave();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setEditName(false);
                      doSave();
                    }
                  }}
                  className="w-full max-w-xl rounded-lg border border-terra/40 bg-ivory px-3 py-1 font-display text-3xl font-semibold leading-tight tracking-tight text-ink outline-none focus:ring-2 focus:ring-terra/25 md:text-4xl"
                />
              ) : (
                <h1
                  onClick={() => setEditName(true)}
                  title="Clic para editar el nombre"
                  className="group flex cursor-pointer items-center gap-3 font-display text-3xl font-semibold leading-tight tracking-tight text-ink md:text-4xl"
                >
                  {nombre}
                  <span className="flex-shrink-0 text-inkfaint opacity-0 transition group-hover:opacity-100">
                    <PencilIcon className="h-5 w-5" />
                  </span>
                </h1>
              )}
            </div>
            <div className="mt-5 flex flex-shrink-0 flex-col items-start gap-2 lg:mt-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-inkfaint">Estado del evento</span>
              <StatusSelector estado={estado} disabled={pending} onChange={requestEstado} />
            </div>
          </div>
        </div>
      </div>

      {/* Cuerpo: nav + contenido */}
      <div className="mx-auto max-w-6xl gap-8 px-6 py-8 lg:grid lg:grid-cols-[210px_1fr] lg:px-10">
        <nav className="mb-6 lg:mb-0">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
            {navItems.map((it) => {
              const isLink = !!it.href;
              const isScroll = !!it.target;
              const activeStyle = 'text-inksoft hover:bg-ink/5 hover:text-ink';
              const scrollStyle = 'bg-terra/10 text-terra hover:bg-terra/15';
              const className = `flex w-full items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-left text-sm font-bold transition ${
                isScroll ? scrollStyle : isLink ? activeStyle : 'cursor-not-allowed text-inkfaint/50'
              }`;
              const inner = (
                <>
                  <span>{it.label}</span>
                  {it.lockedNav ? (
                    <LockIcon className="h-3.5 w-3.5" />
                  ) : it.soon ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-inkfaint/60">pronto</span>
                  ) : null}
                </>
              );
              return (
                <li key={it.label}>
                  {isLink ? (
                    <a href={it.href!} className={className}>
                      {inner}
                    </a>
                  ) : (
                    <button
                      disabled={it.soon}
                      onClick={() => isScroll && scrollToSection(it.target!)}
                      className={className}
                      title={it.soon ? (it.lockedNav ? 'El evento aún no ha iniciado.' : 'Disponible en una fase posterior') : undefined}
                    >
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-8">
          {/* Datos generales */}
          <section id="sec-datos" className="scroll-mt-6 rounded-2xl border border-ink/10 bg-cream/30 p-6 lg:p-8">
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
                    <LockIcon className="h-3.5 w-3.5 text-inkfaint" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-56 -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-center text-xs font-medium normal-case tracking-normal text-ivory group-hover:block">
                      No se puede modificar mientras el evento está activo.
                    </span>
                  </span>
                )}
              </label>
              <div className="flex items-center gap-3 text-[15px] text-inksoft">
                <span>Del</span>
                <input
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                  readOnly={locked}
                  inputMode="numeric"
                  className={`w-16 rounded-xl border px-3 py-3 text-center text-[15px] font-bold text-ink outline-none transition ${
                    locked
                      ? 'cursor-not-allowed border-ink/10 bg-ink/5 text-inkfaint'
                      : 'border-ink/15 bg-cream/60 focus:border-terra focus:ring-2 focus:ring-terra/25'
                  }`}
                />
                <span>al</span>
                <input
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                  readOnly={locked}
                  inputMode="numeric"
                  className={`w-16 rounded-xl border px-3 py-3 text-center text-[15px] font-bold text-ink outline-none transition ${
                    locked
                      ? 'cursor-not-allowed border-ink/10 bg-ink/5 text-inkfaint'
                      : 'border-ink/15 bg-cream/60 focus:border-terra focus:ring-2 focus:ring-terra/25'
                  }`}
                />
                <span className="text-inkfaint">· ej. “Del 1 al 5”</span>
              </div>
            </div>

            {error && (
              <div className="mt-5 flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2.5 text-sm font-medium text-danger" role="alert">
                <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v6M12 16.5v.5" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="mt-7 flex items-center gap-4">
              <button
                onClick={doSave}
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-xl bg-terra px-5 py-3 text-[15px] font-bold text-ivory shadow-terra transition hover:bg-terradeep disabled:opacity-70"
              >
                {pending ? 'Guardando…' : 'Guardar cambios'}
              </button>
              {saved && (
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-olive">
                  <CheckIcon className="h-4 w-4" />
                  Cambios guardados
                </span>
              )}
            </div>
          </section>

          {/* Categorías */}
          <section id="sec-categorias" className="scroll-mt-6 rounded-2xl border border-ink/10 bg-cream/30 p-6 lg:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">Categorías</h2>
              <span className="text-sm text-inkfaint">
                {categorias.length} {categorias.length === 1 ? 'categoría' : 'categorías'}
              </span>
            </div>

            {locked && (
              <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-saffron/12 px-4 py-3 text-sm font-medium text-ink">
                <LockIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-saffron" />
                <span>Las categorías no se pueden modificar mientras el evento está activo.</span>
              </div>
            )}

            {catError && (
              <div className="mt-5 flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2.5 text-sm font-medium text-danger" role="alert">
                <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v6M12 16.5v.5" />
                </svg>
                <span>{catError}</span>
              </div>
            )}

            {categorias.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-ink/20 px-6 py-10 text-center">
                <p className="font-display text-lg font-semibold text-ink">Aún no hay categorías</p>
                <p className="mt-1 text-sm text-inksoft">
                  Añade al menos una antes de activar el evento.
                </p>
              </div>
            ) : (
              <ul className="mt-6 space-y-2.5">
                {categorias.map((c, i) => (
                  <CategoriaRow
                    key={c.id}
                    index={i}
                    categoria={c}
                    locked={locked}
                    onChange={(name) => handleCategoryChange(c.id, name)}
                    onCommit={(prev) => handleCategoryCommit(c.id, prev)}
                    onDelete={() => handleCategoryDelete(c.id)}
                  />
                ))}
              </ul>
            )}

            {!locked && (
              <button
                onClick={handleAddCategory}
                disabled={pending}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-terra/40 px-4 py-3 text-sm font-bold text-terra transition hover:border-terra hover:bg-terra/5 disabled:opacity-60"
              >
                <PlusIcon className="h-4 w-4" /> Añadir categoría
              </button>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        data={confirm}
        busy={pending}
        onCancel={() => {
          setConfirm(null);
          setPendingStatus(null);
        }}
        onConfirm={confirmEstado}
      />
    </>
  );
}

function CategoriaRow({
  index,
  categoria,
  locked,
  onChange,
  onCommit,
  onDelete,
}: {
  index: number;
  categoria: CategoriaVM;
  locked: boolean;
  onChange: (name: string) => void;
  onCommit: (previousValue: string) => void;
  onDelete: () => void;
}) {
  const initialRef = useRef(categoria.nombre);

  // Si el valor cambia desde el servidor (router.refresh), actualizar el snapshot.
  useEffect(() => {
    initialRef.current = categoria.nombre;
  }, [categoria.id]);

  return (
    <li className="flex items-center gap-3 rounded-xl border border-ink/10 bg-ivory px-4 py-3">
      <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-terra/10 font-display text-sm font-semibold text-terra">
        {index + 1}
      </span>
      {locked ? (
        <span className="flex-1 text-[15px] font-medium text-ink">
          {categoria.nombre || <em className="text-inkfaint">Sin nombre</em>}
        </span>
      ) : (
        <input
          value={categoria.nombre}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            initialRef.current = categoria.nombre;
          }}
          onBlur={() => onCommit(initialRef.current)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="Nombre de la categoría"
          className="flex-1 bg-transparent text-[15px] font-medium text-ink outline-none placeholder:text-inkfaint/70"
        />
      )}
      {!locked && (
        <button
          onClick={onDelete}
          className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-inkfaint transition hover:bg-danger/8 hover:text-danger"
          aria-label="Eliminar categoría"
          title="Eliminar"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      )}
    </li>
  );
}
