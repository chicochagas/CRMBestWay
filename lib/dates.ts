// Datas de calendário (YYYY-MM-DD) no fuso de São Paulo (FR-025).
// O servidor da Vercel roda em UTC; sem fixar o fuso, entre 21h e 0h o "hoje" sairia errado.

const TIME_ZONE = 'America/Sao_Paulo';
const DAY_MS = 24 * 60 * 60 * 1000;

const isoDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function todayInSaoPaulo(now: Date = new Date()): string {
  return isoDateFormatter.format(now);
}

function toUtcMidnight(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1);
}

/** Dias de `from` até `to` (positivo quando `to` é depois). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcMidnight(to) - toUtcMidnight(from)) / DAY_MS);
}

/** Dias de atraso de uma data em relação a hoje (0 se vence hoje ou no futuro). */
export function daysOverdue(date: string, today: string): number {
  return Math.max(0, daysBetween(date, today));
}

export function isAfter(date: string, today: string): boolean {
  return daysBetween(today, date) > 0;
}

export function addDays(date: string, days: number): string {
  return new Date(toUtcMidnight(date) + days * DAY_MS).toISOString().slice(0, 10);
}
