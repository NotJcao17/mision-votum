'use client';

import { useEffect, useRef } from 'react';

// Modal base: overlay con backdrop, caja centrada, cierre con Esc y clic fuera.
// El cierre solo dispara si el clic empieza Y termina en el overlay; así
// arrastrar texto desde dentro del modal y soltar fuera no cierra el modal.
export function Modal({
  children,
  onClose,
  maxWidth = 'max-w-md',
}: {
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}) {
  const downOnOverlay = useRef(false);

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
      onMouseDown={(e) => {
        downOnOverlay.current = e.target === e.currentTarget;
      }}
      onMouseUp={(e) => {
        if (downOnOverlay.current && e.target === e.currentTarget) {
          onClose();
        }
        downOnOverlay.current = false;
      }}
    >
      <div
        className={`w-full ${maxWidth} rounded-2xl border border-ink/10 bg-ivory p-6 shadow-2xl`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
