import { AdminHeader } from '@/components/ui/AdminHeader';
import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-ivory font-body text-ink">
      <AdminHeader subtitle="Panel de administración" />
      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Skeleton className="h-10 w-48 md:h-12 md:w-56" />
            <Skeleton className="mt-3 h-4 w-40" />
          </div>
          <Skeleton className="h-12 w-52 rounded-xl" />
        </div>
        <div className="mt-8 space-y-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </main>
    </div>
  );
}
