import { requireJudge } from '@/lib/auth/session';

export default async function JuezHome() {
  await requireJudge();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ivory px-6 py-12 text-center font-body text-ink">
      <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-terra">
        <span className="h-3 w-3 rounded-full bg-terra" />
      </div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Sesión iniciada como juez
      </h1>
      <p className="max-w-xs text-[15px] text-inksoft">
        La pantalla de votación se construye en la Fase 6. Esta vista confirma que
        el login de juez funciona.
      </p>
      <a
        href="/logout"
        className="mt-2 inline-flex items-center gap-2 rounded-xl border border-ink/15 px-5 py-2.5 text-sm font-bold text-ink transition hover:border-terra hover:text-terra"
      >
        Cerrar sesión
      </a>
    </main>
  );
}
