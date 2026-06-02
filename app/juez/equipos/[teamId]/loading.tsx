import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col bg-ivory font-body text-ink">
      <header className="flex items-center gap-3 border-b border-ink/8 px-5 py-3">
        <Skeleton className="h-5 w-16" />
        <div className="flex-1 text-right">
          <Skeleton className="ml-auto h-3 w-20" />
          <Skeleton className="ml-auto mt-1 h-5 w-40" />
        </div>
      </header>
      <div className="flex-1 space-y-6 px-5 py-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="mb-3 h-5 w-48" />
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((__, j) => (
                <Skeleton key={j} className="h-14 flex-1 rounded-2xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-ink/8 px-5 pb-6 pt-3.5">
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
    </main>
  );
}
