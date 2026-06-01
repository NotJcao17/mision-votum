// Misión Votum · Logo + marca (portado de docs/mockups/components/ui.jsx)

export function Brand({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-terra">
        <span className="h-2 w-2 rounded-full bg-terra" />
      </span>
      <div className="leading-tight">
        <div className="whitespace-nowrap font-body text-sm font-bold uppercase tracking-[0.18em] text-terra">
          Misión Votum
        </div>
        {subtitle && <div className="text-xs text-inksoft">{subtitle}</div>}
      </div>
    </div>
  );
}
