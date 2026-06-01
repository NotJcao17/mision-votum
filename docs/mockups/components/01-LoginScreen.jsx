'use client';
/**
 * Misión Votum · Pantalla 1 — Login
 * Dirección visual: "Mercado" (Fraunces + Hanken Grotesk, terracota/oliva/azafrán).
 *
 * Compatible con Next.js. Para preview en navegador usamos los globales de React;
 * en Next.js cambia las 2 líneas marcadas (import / export) por las equivalentes.
 */
const { useState } = React; // Next.js: import { useState } from 'react';

// ── Íconos (inline SVG, sin librerías) ───────────────────────────
function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18M10.6 5.2A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.3 4.1M6.5 6.6A17.4 17.4 0 0 0 2 12s3.5 7 10 7a10.4 10.4 0 0 0 4-.8M9.9 9.9A3 3 0 0 0 14 14" />
    </svg>
  );
}
function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 animate-spin" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg viewBox="0 0 18 14" className="h-3.5 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 7h14M10 2l5 5-5 5" />
    </svg>
  );
}

function LoginScreen() {
  const [usuario, setUsuario] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | error | success
  const [errorMsg, setErrorMsg] = useState('');

  const loading = status === 'loading';

  function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    if (!usuario.trim() || !password) {
      setStatus('error');
      setErrorMsg('Ingresa tu usuario y contraseña.');
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    // Simulación de verificación (mockup): admin / votum2026 → éxito.
    setTimeout(() => {
      const ok = usuario.trim().toLowerCase() === 'admin' && password === 'votum2026';
      if (ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg('Usuario o contraseña incorrectos.');
        setPassword(''); // solo se limpia la contraseña
      }
    }, 1300);
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-ivory font-body text-ink md:grid-cols-[1.05fr_1fr]">
      {/* ── Panel de marca ───────────────────────────────────── */}
      <aside className="relative flex min-h-[36vh] flex-col justify-between overflow-hidden bg-terra px-7 py-9 text-ivory md:min-h-screen md:px-12 md:py-12 lg:px-16">
        {/* anillos decorativos */}
        <div className="pointer-events-none absolute -bottom-28 -right-24 h-80 w-80 rounded-full border border-ivory/20" />
        <div className="pointer-events-none absolute -bottom-12 -right-8 h-56 w-56 rounded-full border border-ivory/15" />

        <div className="relative flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-ivory/70">
            <span className="h-2 w-2 rounded-full bg-ivory" />
          </span>
          <span className="text-sm font-bold uppercase tracking-[0.22em]">Misión Votum</span>
        </div>

        <div className="relative max-w-md py-8">
          <h1 className="font-display text-[2.6rem] font-semibold leading-[1.02] tracking-tight md:text-5xl lg:text-6xl">
            Vota lo mejor<br />del mundo.
          </h1>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-ivory/85 md:text-lg">
            La plataforma de votación de los concursos culturales del colegio: comida, monumentos, vestimenta y danza de cada país.
          </p>
          <div className="mt-7 flex gap-1.5 text-2xl md:text-3xl" aria-hidden="true">
            <span>🇮🇹</span><span>🇯🇵</span><span>🇲🇽</span><span>🇮🇳</span><span>🇫🇷</span><span>🇲🇦</span><span>🇧🇷</span>
          </div>
        </div>

        <p className="relative font-body text-xs uppercase tracking-[0.2em] text-ivory/70">
          Concursos de cultura internacional · 2026
        </p>
      </aside>

      {/* ── Panel de formulario ──────────────────────────────── */}
      <main className="flex items-center justify-center px-7 py-12 md:px-12">
        <div className="w-full max-w-sm">
          {status === 'success' ? (
            <div className="flex flex-col items-center text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-olive/12 text-olive">
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              </span>
              <h2 className="mt-6 font-display text-3xl font-semibold">¡Bienvenido!</h2>
              <p className="mt-2 text-inksoft">Te estamos llevando a tu panel…</p>
              <div className="mt-5 text-olive"><Spinner /></div>
            </div>
          ) : (
            <>
              <h2 className="font-display text-3xl font-semibold tracking-tight md:text-[2rem]">Inicia sesión</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-inksoft">
                Accede con las credenciales que te compartió el colegio. El sistema te llevará a tu panel según tu rol.
              </p>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
                {/* Usuario */}
                <div>
                  <label htmlFor="usuario" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inksoft">
                    Usuario
                  </label>
                  <input
                    id="usuario"
                    type="text"
                    autoComplete="off"
                    value={usuario}
                    disabled={loading}
                    onChange={(e) => setUsuario(e.target.value)}
                    placeholder="tu.usuario"
                    className="w-full rounded-xl border border-ink/15 bg-cream/60 px-4 py-3.5 text-[15px] text-ink outline-none transition placeholder:text-inkfaint/70 focus:border-terra focus:bg-cream focus:ring-2 focus:ring-terra/25 disabled:opacity-50"
                  />
                </div>

                {/* Contraseña */}
                <div>
                  <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inksoft">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      disabled={loading}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-ink/15 bg-cream/60 px-4 py-3.5 pr-12 text-[15px] text-ink outline-none transition placeholder:text-inkfaint/70 focus:border-terra focus:bg-cream focus:ring-2 focus:ring-terra/25 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      disabled={loading}
                      aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="absolute right-3 top-1/2 grid -translate-y-1/2 place-items-center rounded-md p-1 text-inksoft transition hover:text-ink disabled:opacity-50"
                    >
                      <EyeIcon open={showPass} />
                    </button>
                  </div>
                </div>

                {/* Error inline */}
                {status === 'error' && (
                  <div className="flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2.5 text-sm font-medium text-danger" role="alert">
                    <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.5" /></svg>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Botón */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-terra py-3.5 text-base font-bold text-ivory shadow-terra transition hover:bg-terradeep disabled:cursor-not-allowed disabled:opacity-80"
                >
                  {loading ? (<><Spinner /> Entrando…</>) : (<>Entrar <ArrowIcon /></>)}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-inkfaint">
                Demo · usuario <span className="font-semibold text-inksoft">admin</span> · contraseña <span className="font-semibold text-inksoft">votum2026</span>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// Preview glue — en Next.js reemplaza por:  export default LoginScreen;
window.LoginScreen = LoginScreen;
