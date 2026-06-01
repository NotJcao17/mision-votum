'use client';
/**
 * Misión Votum · UI compartida del área admin (Dirección "Mercado")
 * Íconos inline (sin librerías), AdminHeader y StatusBadge.
 * En Next.js: exporta cada uno con `export function ...`.
 */

// ── Íconos ───────────────────────────────────────────────────────
const I = {
  plus: (c = 'h-4 w-4') => (<svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>),
  pencil: (c = 'h-4 w-4') => (<svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>),
  trash: (c = 'h-4 w-4') => (<svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" /></svg>),
  logout: (c = 'h-4 w-4') => (<svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>),
  chevright: (c = 'h-4 w-4') => (<svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>),
  calendar: (c = 'h-4 w-4') => (<svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4.5" width="18" height="17" rx="2.5" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></svg>),
  users: (c = 'h-4 w-4') => (<svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM22 19v-2a4 4 0 0 0-3-3.85M16 2.15A4 4 0 0 1 16 9.9" /></svg>),
  gavel: (c = 'h-4 w-4') => (<svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m14 13-7.5 7.5a2.1 2.1 0 0 1-3-3L11 10M14.5 5.5l4 4M9.5 10.5l4 4M17 3l4 4-2.5 2.5-4-4Z" /></svg>),
};

// ── Badge de estado ──────────────────────────────────────────────
const ESTADOS = {
  Activo:   { dot: 'bg-olive',     text: 'text-olive',     bg: 'bg-olive/12' },
  Borrador: { dot: 'bg-inkfaint',  text: 'text-inksoft',   bg: 'bg-ink/8' },
  Cerrado:  { dot: 'bg-[#3F5168]', text: 'text-[#3F5168]', bg: 'bg-[#3F5168]/12' },
};
function StatusBadge({ estado }) {
  const s = ESTADOS[estado] || ESTADOS.Borrador;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${s.bg} px-2.5 py-1 text-xs font-bold ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />{estado}
    </span>
  );
}

// ── Logo + marca ─────────────────────────────────────────────────
function Brand({ subtitle }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-terra">
        <span className="h-2 w-2 rounded-full bg-terra" />
      </span>
      <div className="leading-tight">
        <div className="whitespace-nowrap font-body text-sm font-bold uppercase tracking-[0.18em] text-terra">Misión Votum</div>
        {subtitle && <div className="text-xs text-inksoft">{subtitle}</div>}
      </div>
    </div>
  );
}

// ── Header del admin ─────────────────────────────────────────────
function AdminHeader({ subtitle, admin = 'Lucía Méndez' }) {
  const initials = admin.split(' ').map((p) => p[0]).slice(0, 2).join('');
  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-ivory/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-10">
        <Brand subtitle={subtitle} />
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="whitespace-nowrap text-sm font-bold leading-tight text-ink">{admin}</div>
            <div className="text-xs text-inkfaint">Administradora</div>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-terra font-body text-sm font-bold text-ivory">{initials}</span>
          <button className="grid h-10 w-10 place-items-center rounded-full border border-ink/15 text-inksoft transition hover:border-ink/30 hover:text-ink" title="Cerrar sesión" aria-label="Cerrar sesión">
            {I.logout('h-[18px] w-[18px]')}
          </button>
        </div>
      </div>
    </header>
  );
}

Object.assign(window, { MVIcons: I, StatusBadge, AdminHeader, Brand, ESTADOS });
