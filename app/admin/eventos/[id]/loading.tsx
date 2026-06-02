import { AdminHeader } from '@/components/ui/AdminHeader';
import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-ivory font-body text-ink">
      <AdminHeader subtitle="Configuración de evento" />
      <div className="border-b border-ink/10 bg-cream/30">
        <div className="mx-auto max-w-6xl px-6 py-6 lg:px-10">
          <Skeleton className="mb-4 h-4 w-44" />
          <div className="lg:flex lg:items-end lg:justify-between lg:gap-6">
            <Skeleton className="h-10 w-72 md:h-12 md:w-96" />
            <div className="mt-5 lg:mt-0">
              <Skeleton className="mb-2 h-3 w-32" />
              <Skeleton className="h-11 w-64 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl gap-8 px-6 py-8 lg:grid lg:grid-cols-[210px_1fr] lg:px-10">
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
        <div className="space-y-8">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
