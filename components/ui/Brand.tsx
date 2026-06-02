// Misión Votum · Logo + marca
import Image from 'next/image';

export function Brand({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/logo-nobg-128.png"
        alt="Misión Votum"
        width={36}
        height={36}
        priority
        className="h-9 w-9"
      />
      <div className="leading-tight">
        <div className="whitespace-nowrap font-body text-sm font-bold uppercase tracking-[0.18em] text-terra">
          Misión Votum
        </div>
        {subtitle && <div className="text-xs text-inksoft">{subtitle}</div>}
      </div>
    </div>
  );
}
