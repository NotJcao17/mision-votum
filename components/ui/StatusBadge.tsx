// Misión Votum · Badge de estado del evento (portado de docs/mockups/components/ui.jsx)

export type EstadoEvento = 'Activo' | 'Borrador' | 'Cerrado';

const ESTADOS: Record<EstadoEvento, { dot: string; text: string; bg: string }> = {
  Activo:   { dot: 'bg-olive',     text: 'text-olive',     bg: 'bg-olive/12' },
  Borrador: { dot: 'bg-inkfaint',  text: 'text-inksoft',   bg: 'bg-ink/8' },
  Cerrado:  { dot: 'bg-[#3F5168]', text: 'text-[#3F5168]', bg: 'bg-[#3F5168]/12' },
};

export function StatusBadge({ estado }: { estado: EstadoEvento }) {
  const s = ESTADOS[estado] ?? ESTADOS.Borrador;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${s.bg} px-2.5 py-1 text-xs font-bold ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {estado}
    </span>
  );
}
