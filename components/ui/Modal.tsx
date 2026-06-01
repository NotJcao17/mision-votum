'use client';

import { useEffect } from 'react';

// Modal base: overlay con backdrop, caja centrada, cierre con Esc y clic fuera.
export function Modal({
  children,
  onClose,
  maxWidth = 'max-w-md',
}: {
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} rounded-2xl border border-ink/10 bg-ivory p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
