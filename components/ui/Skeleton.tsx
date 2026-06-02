// Bloque placeholder con pulso para los loading.tsx.

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-ink/8 ${className}`} />;
}
