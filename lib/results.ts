// Cálculo puro de rankings por categoría (sección 5.3 del contexto).
// Reutilizado por la pantalla de resultados (Fase 8) y la exportación a
// Excel (Fase 9).

export interface VoteRow {
  teamId: string;
  categoryId: string;
  score: number;
}

export interface TeamRef {
  id: string;
  name: string;
}

export interface CategoryRef {
  id: string;
  name: string;
}

export interface TeamScore {
  teamId: string;
  name: string;
  average: number;
  votes: number;
}

export interface CategoryRanking {
  id: string;
  name: string;
  rows: TeamScore[];
}

export function computeCategoryRankings(
  votes: VoteRow[],
  teams: TeamRef[],
  categories: CategoryRef[],
): CategoryRanking[] {
  const teamName = new Map(teams.map((t) => [t.id, t.name]));

  // Acumula sum y count por (categoryId, teamId).
  type Acc = { sum: number; count: number };
  const buckets = new Map<string, Map<string, Acc>>();
  for (const c of categories) buckets.set(c.id, new Map());

  for (const v of votes) {
    const cat = buckets.get(v.categoryId);
    if (!cat) continue;
    const cur = cat.get(v.teamId) ?? { sum: 0, count: 0 };
    cur.sum += v.score;
    cur.count += 1;
    cat.set(v.teamId, cur);
  }

  return categories.map((c) => {
    const cat = buckets.get(c.id) ?? new Map<string, Acc>();
    const rows: TeamScore[] = [];
    for (const [teamId, acc] of cat) {
      if (acc.count === 0) continue;
      rows.push({
        teamId,
        name: teamName.get(teamId) ?? '(equipo eliminado)',
        average: acc.sum / acc.count,
        votes: acc.count,
      });
    }
    rows.sort((a, b) => {
      if (b.average !== a.average) return b.average - a.average;
      if (b.votes !== a.votes) return b.votes - a.votes;
      return a.name.localeCompare(b.name, 'es-MX');
    });
    return { id: c.id, name: c.name, rows };
  });
}
