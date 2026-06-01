'use client';

import type { EstadoEvento } from './StatusBadge';

const COLOR: Record<EstadoEvento, string> = {
  Borrador: 'bg-inkfaint',
  Activo: 'bg-olive',
  Cerrado: 'bg-[#3F5168]',
};

const OPCIONES: EstadoEvento[] = ['Borrador', 'Activo', 'Cerrado'];

export function StatusSelector({
  estado,
  disabled = false,
  onChange,
}: {
  estado: EstadoEvento;
  disabled?: boolean;
  onChange: (next: EstadoEvento) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-ink/12 bg-cream/50 p-1">
      {OPCIONES.map((op) => {
        const active = op === estado;
        return (
          <button
            key={op}
            disabled={disabled}
            onClick={() => onChange(op)}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              active
                ? 'bg-ivory text-ink shadow-sm ring-1 ring-ink/10'
                : 'text-inkfaint hover:text-inksoft'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${active ? COLOR[op] : 'bg-current opacity-40'}`} />
            {op}
          </button>
        );
      })}
    </div>
  );
}
