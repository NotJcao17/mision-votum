import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <main className="min-h-screen bg-ivory pb-10 font-body text-ink">
      <header className="flex items-start justify-between gap-3 px-5 pb-1 pt-6">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-7 w-40" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </header>
      <section className="mx-5 mt-4 space-y-2 rounded-2xl bg-cream px-5 py-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-2 h-2.5 w-full rounded-full" />
      </section>
      <div className="mt-6 space-y-2.5 px-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    </main>
  );
}
