'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/ui/AdminHeader';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('[admin] error boundary:', error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== 'production';

  function handleRetry() {
    // router.refresh() fuerza re-fetch de datos del servidor (vital cuando
    // el error vino de Prisma con conexiones colgadas); reset() recupera
    // el segmento del error.
    router.refresh();
    reset();
  }

  return (
    <div className="min-h-screen bg-ivory font-body text-ink">
      <AdminHeader subtitle="Error" />
      <main className="mx-auto max-w-3xl px-6 py-16 lg:px-10">
        <div className="rounded-2xl border border-ink/10 bg-cream/30 px-6 py-12 text-center">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            No pudimos cargar esta pantalla
          </h1>
          <p className="mt-2 text-[15px] text-inksoft">
            Esto suele resolverse al reintentar. Si persiste, revisa tu conexión.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 rounded-xl bg-terra px-5 py-2.5 text-sm font-bold text-ivory shadow-terra transition hover:bg-terradeep"
            >
              Reintentar
            </button>
            <a
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl border border-ink/15 px-5 py-2.5 text-sm font-bold text-ink transition hover:border-terra hover:text-terra"
            >
              Volver al inicio
            </a>
          </div>
          {isDev && (
            <p className="mt-6 break-words font-mono text-xs text-inkfaint">
              {error.message}
              {error.digest ? ` · digest: ${error.digest}` : ''}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
