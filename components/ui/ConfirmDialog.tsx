'use client';

import { useEffect, useState } from 'react';

export interface ConfirmData {
  title: string;
  body: string;
  // Si se define, exige escribir este texto para habilitar el botón (confirmación fuerte).
  requireText?: string;
  confirmLabel?: string;
  // Clase del botón de confirmar (ej. 'bg-danger hover:bg-danger/90').
  confirmClass?: string;
  // Si true, solo muestra un botón de aceptar (aviso, sin acción destructiva).
  acceptOnly?: boolean;
}

export function ConfirmDialog({
  data,
  busy = false,
  onCancel,
  onConfirm,
}: {
  data: ConfirmData | null;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [text, setText] = useState('');

  useEffect(() => {
    setText('');
  }, [data]);

  if (!data) return null;

  const fuerte = !!data.requireText;
  const matches =
    !fuerte || text.trim().toLowerCase() === data.requireText!.toLowerCase();
  const canConfirm = matches && !busy;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-ink/10 bg-ivory p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span
            className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-full ${
              fuerte ? 'bg-danger/12 text-danger' : 'bg-saffron/15 text-saffron'
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 8v5M12 16.5v.3M10.3 3.9 2.4 18a1.8 1.8 0 0 0 1.6 2.7h16a1.8 1.8 0 0 0 1.6-2.7L13.7 3.9a1.8 1.8 0 0 0-3.4 0Z" />
            </svg>
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
            <input
              autoFocus
              value={text}
              disabled={busy}
              onChange={(e) => setText(e.target.value)}
              className="w-full rounded-lg border border-ink/15 bg-cream/60 px-3 py-2.5 text-sm text-ink outline-none focus:border-danger focus:ring-2 focus:ring-danger/20 disabled:opacity-50"
              placeholder={data.requireText}
            />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          {!data.acceptOnly && (
            <button
              onClick={onCancel}
              disabled={busy}
              className="rounded-lg px-4 py-2.5 text-sm font-bold text-inksoft transition hover:bg-ink/5 hover:text-ink disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
          <button
            disabled={!canConfirm}
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2.5 text-sm font-bold text-ivory transition disabled:cursor-not-allowed disabled:opacity-40 ${
              data.confirmClass || 'bg-terra hover:bg-terradeep'
            }`}
          >
            {busy ? 'Procesando…' : data.confirmLabel || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
