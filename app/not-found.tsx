import { Brand } from '@/components/ui/Brand';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-ivory px-6 py-12 text-center font-body text-ink">
      <Brand />
      <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">
        Esta página no existe
      </h1>
      <p className="max-w-md text-[15px] text-inksoft">
        Es posible que el enlace esté roto o que el recurso ya no esté disponible.
      </p>
      <a
        href="/"
        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-terra px-5 py-3 text-sm font-bold text-ivory shadow-terra transition hover:bg-terradeep"
      >
        Volver al inicio
      </a>
    </main>
  );
}
