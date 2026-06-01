import { requireAdmin } from '@/lib/auth/session';
import { AdminHeader } from '@/components/ui/AdminHeader';

export default async function AdminHome() {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-ivory font-body text-ink">
      <AdminHeader subtitle="Panel de administración" />
      <main className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
        <div className="rounded-2xl border border-ink/10 bg-cream/40 p-10 text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            Sesión iniciada como administrador
          </h1>
          <p className="mt-3 text-[15px] text-inksoft">
            El dashboard de eventos se construye en la Fase 2. Por ahora, esta
            pantalla confirma que la autenticación y la protección de rutas funcionan.
          </p>
          <a
            href="/logout"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-ink/15 px-5 py-2.5 text-sm font-bold text-ink transition hover:border-terra hover:text-terra"
          >
            Cerrar sesión
          </a>
        </div>
      </main>
    </div>
  );
}
