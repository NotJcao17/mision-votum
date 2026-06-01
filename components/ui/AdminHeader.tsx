// Misión Votum · Header del admin (portado de docs/mockups/components/ui.jsx)
// El botón de cerrar sesión apunta a la ruta /logout.

import { Brand } from './Brand';
import { LogoutIcon } from './icons';

export function AdminHeader({
  subtitle,
  admin = 'Administrador',
}: {
  subtitle?: string;
  admin?: string;
}) {
  const initials = admin
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');

  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-ivory/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-10">
        <Brand subtitle={subtitle} />
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="whitespace-nowrap text-sm font-bold leading-tight text-ink">{admin}</div>
            <div className="text-xs text-inkfaint">Administrador</div>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-terra font-body text-sm font-bold text-ivory">
            {initials}
          </span>
          <a
            href="/logout"
            className="grid h-10 w-10 place-items-center rounded-full border border-ink/15 text-inksoft transition hover:border-ink/30 hover:text-ink"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogoutIcon className="h-[18px] w-[18px]" />
          </a>
        </div>
      </div>
    </header>
  );
}
