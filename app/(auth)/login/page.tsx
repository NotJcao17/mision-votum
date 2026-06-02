'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { loginAction } from './actions';
import { EyeIcon, Spinner, ArrowIcon } from '@/components/ui/icons';

type Status = 'idle' | 'loading' | 'error' | 'success';

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const loading = status === 'loading';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (!usuario.trim() || !password) {
      setStatus('error');
      setErrorMsg('Ingresa tu usuario y contraseña.');
      return;
    }
    setStatus('loading');
    setErrorMsg('');

    const result = await loginAction(usuario, password);

    if (result.ok) {
      setStatus('success');
      router.push(result.role === 'admin' ? '/admin' : '/juez');
      router.refresh();
    } else {
      setStatus('error');
      setErrorMsg(result.error ?? 'Usuario o contraseña incorrectos.');
      setPassword(''); // solo se limpia la contraseña
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-ivory font-body text-ink md:grid-cols-[1.05fr_1fr]">
      {/* ── Panel de marca ───────────────────────────────────── */}
      <aside className="relative flex min-h-[36vh] flex-col justify-between overflow-hidden bg-terra px-7 py-9 text-ivory md:min-h-screen md:px-12 md:py-12 lg:px-16">
        <div className="pointer-events-none absolute -bottom-28 -right-24 h-80 w-80 rounded-full border border-ivory/20" />
        <div className="pointer-events-none absolute -bottom-12 -right-8 h-56 w-56 rounded-full border border-ivory/15" />

        <div className="relative flex items-center gap-3">
          <Image
            src="/logo-crema-128.png"
            alt="Misión Votum"
            width={36}
            height={36}
            priority
            className="h-9 w-9"
          />
          <span className="text-sm font-bold uppercase tracking-[0.22em]">Misión Votum</span>
        </div>

        <div className="relative max-w-md py-8">
          <h1 className="font-display text-[2.6rem] font-semibold leading-[1.02] tracking-tight md:text-5xl lg:text-6xl">
            Vota lo mejor<br />del mundo.
          </h1>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-ivory/85 md:text-lg">
            La plataforma de votación de los concursos culturales del colegio.
          </p>
          <div className="mt-7 flex items-center gap-2" aria-hidden="true">
            {['it','jp','mx','in','fr','ma','br'].map((c) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={c} src={`https://flagcdn.com/w40/${c}.png`} width={28} height={21} alt="" className="rounded-sm shadow-sm" />
            ))}
          </div>
        </div>

        <p className="relative font-body text-xs uppercase tracking-[0.2em] text-ivory/70">
          Concursos de cultura internacional
        </p>
      </aside>

      {/* ── Panel de formulario ──────────────────────────────── */}
      <main className="flex items-center justify-center px-7 py-12 md:px-12">
        <div className="w-full max-w-sm">
          {status === 'success' ? (
            <div className="flex flex-col items-center text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-olive/12 text-olive">
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
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
                    <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v6M12 16.5v.5" />
                    </svg>
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
            </>
          )}
        </div>
      </main>
    </div>
  );
}
