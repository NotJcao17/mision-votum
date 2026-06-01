export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <div className="grid h-16 w-16 place-items-center rounded-full border-2 border-terra">
        <span className="h-4 w-4 rounded-full bg-terra" />
      </div>
      <h1 className="font-display text-4xl font-bold text-terra">
        Misión Votum
      </h1>
      <p className="font-body text-inksoft">
        Sistema de votaciones — Colegio Misión Montessori
      </p>
      <span className="mt-4 rounded-lg bg-cream px-4 py-2 font-body text-sm text-inkfaint">
        Fase 0: Setup completado ✓
      </span>
    </main>
  );
}
