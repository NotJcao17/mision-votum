'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckIcon } from './icons';

export type ToastVariant = 'success' | 'info';

interface ToastState {
  msg: string;
  variant: ToastVariant;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, variant: ToastVariant = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ msg, variant });
    timer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { toast, showToast };
}

export function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;
  const dot = toast.variant === 'success' ? 'bg-olive' : 'bg-saffron';
  return (
    <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2">
      <div className="flex items-center gap-2.5 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-ivory shadow-2xl">
        <span className={`grid h-5 w-5 place-items-center rounded-full ${dot}`}>
          <CheckIcon className="h-3 w-3" />
        </span>
        {toast.msg}
      </div>
    </div>
  );
}
