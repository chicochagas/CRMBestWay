import type { TodayItem as TodayItemData } from '@/lib/services/today/getTodayList';
import { TodayItem } from './TodayItem';

/** "Hoje": atrasados primeiro (mais antigos antes), depois os de hoje (FR-021, FR-022). */
export function TodayList({ items, today, showOwner }: { items: TodayItemData[]; today: string; showOwner: boolean }) {
  if (items.length === 0) {
    return (
      <div className="rounded-card border border-border bg-card p-10 text-center">
        <p className="text-lg font-semibold">Você está em dia 🎉</p>
        <p className="mt-1 text-sm text-muted-foreground">Nenhum follow-up para hoje nem atrasado.</p>
      </div>
    );
  }

  const overdue = items.filter((item) => item.daysOverdue > 0);
  const dueToday = items.filter((item) => item.daysOverdue === 0);

  return (
    <div className="grid gap-8">
      {overdue.length > 0 && (
        <section aria-labelledby="atrasados">
          <h2 id="atrasados" className="mb-3 text-sm font-semibold uppercase tracking-wide text-danger">
            Atrasados ({overdue.length})
          </h2>
          <ul className="grid gap-3">
            {overdue.map((item) => (
              <TodayItem key={item.dealId} item={item} today={today} showOwner={showOwner} />
            ))}
          </ul>
        </section>
      )}
      {dueToday.length > 0 && (
        <section aria-labelledby="hoje">
          <h2 id="hoje" className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand">
            Hoje ({dueToday.length})
          </h2>
          <ul className="grid gap-3">
            {dueToday.map((item) => (
              <TodayItem key={item.dealId} item={item} today={today} showOwner={showOwner} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
