import ExcelJS from 'exceljs';
import { computeCategoryRankings } from './results';

export interface ExcelTeam {
  id: string;
  name: string;
}

export interface ExcelCategory {
  id: string;
  name: string;
}

export interface ExcelJudge {
  id: string;
  name: string;
  username: string;
}

export interface ExcelVote {
  teamId: string;
  categoryId: string;
  judgeId: string;
  score: number;
  updatedAt: Date;
}

function toMexicoCityDate(date: Date): Date {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const p = Object.fromEntries(
    f.formatToParts(date)
      .filter((x) => x.type !== 'literal')
      .map((x) => [x.type, parseInt(x.value, 10)]),
  ) as { year: number; month: number; day: number; hour: number; minute: number; second: number };
  return new Date(Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second));
}

export function slugifyEventName(name: string): string {
  const base = name
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return base || 'resultados';
}

const HEADER_FILL: ExcelJS.FillPattern = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF2E7D4' }, // cream
};
const HEADER_FONT = { bold: true, color: { argb: 'FF2B1D14' } }; // ink

function styleHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFE0D4BC' } },
    };
  });
  row.height = 22;
}

export async function buildEventWorkbook(args: {
  eventName: string;
  categories: ExcelCategory[];
  teams: ExcelTeam[];
  judges: ExcelJudge[];
  votes: ExcelVote[];
}): Promise<ExcelJS.Workbook> {
  const { eventName, categories, teams, judges, votes } = args;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Misión Votum';
  wb.created = new Date();

  // ── Hoja Resumen ──────────────────────────────────────────────────
  const summary = wb.addWorksheet('Resumen', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  const rankings = computeCategoryRankings(votes, teams, categories);

  // Mapa { teamId -> { categoryId -> { average, position } } }
  const summaryByTeam = new Map<
    string,
    Map<string, { average: number; position: number }>
  >();
  for (const r of rankings) {
    r.rows.forEach((row, idx) => {
      const cat = summaryByTeam.get(row.teamId) ?? new Map();
      cat.set(r.id, { average: row.average, position: idx + 1 });
      summaryByTeam.set(row.teamId, cat);
    });
  }

  const summaryCols: Partial<ExcelJS.Column>[] = [
    { header: 'Equipo', key: 'team', width: 32 },
  ];
  for (const c of categories) {
    summaryCols.push({
      header: `${c.name} — Promedio`,
      key: `cat_${c.id}_avg`,
      width: 22,
    });
    summaryCols.push({
      header: `${c.name} — Posición`,
      key: `cat_${c.id}_pos`,
      width: 16,
    });
  }
  summaryCols.push({ header: 'Promedio general', key: 'overall', width: 18 });
  summary.columns = summaryCols;
  styleHeader(summary.getRow(1));

  const sortedTeams = [...teams].sort((a, b) =>
    a.name.localeCompare(b.name, 'es-MX'),
  );

  for (const team of sortedTeams) {
    const row: Record<string, string | number> = { team: team.name };
    const teamCats = summaryByTeam.get(team.id);
    let sumAverages = 0;
    let countAverages = 0;
    for (const c of categories) {
      const entry = teamCats?.get(c.id);
      if (entry) {
        row[`cat_${c.id}_avg`] = Number(entry.average.toFixed(2));
        row[`cat_${c.id}_pos`] = entry.position;
        sumAverages += entry.average;
        countAverages += 1;
      }
    }
    if (countAverages > 0) {
      row.overall = Number((sumAverages / countAverages).toFixed(2));
    }
    summary.addRow(row);
  }

  summary.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    row.eachCell((cell, colNumber) => {
      if (colNumber === 1) return;
      cell.alignment = { horizontal: 'right' };
    });
  });

  // ── Hoja Detalle ──────────────────────────────────────────────────
  const detail = wb.addWorksheet('Detalle', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  detail.columns = [
    { header: 'Equipo', key: 'team', width: 32 },
    { header: 'Categoría', key: 'category', width: 24 },
    { header: 'Juez', key: 'judge', width: 24 },
    { header: 'Usuario', key: 'username', width: 14 },
    { header: 'Puntuación', key: 'score', width: 12 },
    { header: 'Fecha/Hora', key: 'datetime', width: 22 },
  ];
  styleHeader(detail.getRow(1));

  const teamName = new Map(teams.map((t) => [t.id, t.name]));
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const judgeById = new Map(judges.map((j) => [j.id, j]));

  const sortedVotes = [...votes].sort((a, b) => {
    const t = (teamName.get(a.teamId) ?? '').localeCompare(
      teamName.get(b.teamId) ?? '',
      'es-MX',
    );
    if (t !== 0) return t;
    const c = (categoryName.get(a.categoryId) ?? '').localeCompare(
      categoryName.get(b.categoryId) ?? '',
      'es-MX',
    );
    if (c !== 0) return c;
    const ja = judgeById.get(a.judgeId);
    const jb = judgeById.get(b.judgeId);
    return (ja?.name ?? '').localeCompare(jb?.name ?? '', 'es-MX');
  });

  for (const v of sortedVotes) {
    const judge = judgeById.get(v.judgeId);
    detail.addRow({
      team: teamName.get(v.teamId) ?? '(equipo eliminado)',
      category: categoryName.get(v.categoryId) ?? '(categoría eliminada)',
      judge: judge?.name ?? '(juez eliminado)',
      username: judge?.username ?? '',
      score: v.score,
      datetime: toMexicoCityDate(v.updatedAt),
    });
  }
  detail.getColumn('datetime').numFmt = 'yyyy-mm-dd hh:mm';

  // Anota el nombre del evento como propiedad del documento.
  wb.title = `Resultados — ${eventName}`;

  return wb;
}
