// Generación de usernames legibles a partir del nombre completo.
// Patrón: inicial + apellido(s) concatenados, normalizado a [a-z], máx 10 chars.

const MAX_LENGTH = 10;

export function buildBaseUsername(name: string): string {
  const parts = name
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return 'juez';

  const initial = parts[0][0] ?? '';
  const rest = parts.slice(1).join('');
  const combined = (initial + (rest || parts[0].slice(1))).replace(/[^a-z]/g, '');

  const base = combined.slice(0, MAX_LENGTH);
  return base || 'juez';
}

// Busca el primer candidato libre: base, base2, base3...
export async function generateUniqueUsername(
  base: string,
  isTaken: (candidate: string) => Promise<boolean>,
): Promise<string> {
  if (!(await isTaken(base))) return base;
  let n = 2;
  // Evitamos un bucle infinito accidental con un techo razonable.
  while (n < 10000) {
    const candidate = `${base}${n}`;
    if (!(await isTaken(candidate))) return candidate;
    n += 1;
  }
  throw new Error('No se pudo generar un username único.');
}
