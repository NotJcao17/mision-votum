'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, background: '#FAF5EC', fontFamily: 'system-ui, sans-serif' }}>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            color: '#2B1D14',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.75rem', fontWeight: 600 }}>
            Algo salió mal
          </h1>
          <p style={{ marginTop: '0.75rem', color: '#6F5E4C', maxWidth: '28rem' }}>
            La aplicación encontró un problema inesperado. Intenta recargar.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 1.25rem',
              borderRadius: '0.75rem',
              background: '#C2552F',
              color: '#FAF5EC',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Recargar
          </button>
          {process.env.NODE_ENV !== 'production' && (
            <p
              style={{
                marginTop: '2rem',
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                color: '#A2917C',
                maxWidth: '32rem',
                wordBreak: 'break-word',
              }}
            >
              {error.message}
              {error.digest ? ` · ${error.digest}` : ''}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
