'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function JuezError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('[juez] error boundary:', error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== 'production';

  function handleRetry() {
    router.refresh();
    reset();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 py-12 text-center font-body text-ink">
      <Image
        src="/logo-nobg-128.png"
        alt="Misión Votum"
        width={56}
        height={56}
        className="h-14 w-14"
      />
      <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight">
        No pudimos cargar tu pantalla
      </h1>
      <p className="mt-2 max-w-xs text-[15px] text-inksoft">
        Revisa tu conexión y vuelve a intentar.
      </p>
      <div className="mt-6 flex flex-col items-center gap-3">
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-terra px-5 py-3 text-sm font-bold text-ivory shadow-terra transition hover:bg-terradeep"
        >
          Reintentar
        </button>
        <a
          href="/logout"
          className="text-xs font-bold text-inksoft transition hover:text-terra"
        >
          Cerrar sesión
        </a>
      </div>
      {isDev && (
        <p className="mt-8 max-w-xs break-words font-mono text-[10px] text-inkfaint">
          {error.message}
          {error.digest ? ` · ${error.digest}` : ''}
        </p>
      )}
    </main>
  );
}
