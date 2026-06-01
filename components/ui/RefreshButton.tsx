'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshIcon } from './icons';

export function RefreshButton({ label = 'Refrescar' }: { label?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [spinning, setSpinning] = useState(false);

  function handleClick() {
    setSpinning(true);
    startTransition(() => {
      router.refresh();
      // Mantén el spinner un instante mínimo para feedback visual.
      setTimeout(() => setSpinning(false), 500);
    });
  }

  const busy = pending || spinning;

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className="inline-flex flex-shrink-0 items-center gap-2 self-start rounded-xl border border-ink/20 px-4 py-2.5 text-sm font-bold text-ink transition hover:border-terra hover:text-terra disabled:cursor-wait disabled:opacity-60 sm:self-auto"
    >
      <RefreshIcon className={`h-[18px] w-[18px] ${busy ? 'animate-spin' : ''}`} />
      {label}
    </button>
  );
}
