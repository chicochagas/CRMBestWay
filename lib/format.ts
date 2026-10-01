const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const dateTime = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatBRL(value: number | null | undefined): string {
  return brl.format(value ?? 0);
}

/** YYYY-MM-DD → dd/mm/aaaa (sem passar por Date, para não sofrer com fuso). */
export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}
