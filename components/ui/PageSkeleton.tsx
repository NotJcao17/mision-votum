import { AdminHeader } from './AdminHeader';
import { Skeleton } from './Skeleton';

// Esqueleto genérico para las páginas internas del admin de un evento
// (Equipos, Jueces, Progreso, Resultados). Estructura: header del evento +
// barra de herramientas + lista placeholder.
export function PageSkeleton({
  subtitle,
  rows = 5,
}: {
  subtitle: string;
  rows?: number;
}) {
  return (
    <div className="min-h-screen bg-ivory font-body text-ink">
      <AdminHeader subtitle={subtitle} />
      <div className="border-b border-ink/10 bg-cream/30">
        <div className="mx-auto max-w-5xl px-6 py-6 lg:px-10">
          <Skeleton className="mb-3 h-4 w-40" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-9 w-72" />
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-full sm:max-w-xs" />
          <div className="flex gap-2.5">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Skeleton className="mt-5 h-4 w-48" />
        <div className="mt-4 space-y-2.5">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </main>
    </div>
  );
}
