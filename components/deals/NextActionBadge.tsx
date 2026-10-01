import { daysOverdue } from '@/lib/dates';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

type Props = { action: string | null; date: string | null; today: string; className?: string };

/** Próxima ação + data. Atrasada em vermelho (com texto, não só cor); hoje em destaque. */
export function NextActionBadge({ action, date, today, className }: Props) {
  if (!action || !date) return <p className={cn('text-xs text-muted-foreground', className)}>Sem próxima ação</p>;

  const overdue = daysOverdue(date, today);
  const isToday = date === today;

  return (
    <div className={cn('text-xs', className)}>
      <p className="line-clamp-2 font-medium text-foreground">{action}</p>
      <p
        className={cn(
          'mt-0.5',
          overdue > 0 ? 'font-semibold text-danger' : isToday ? 'font-semibold text-brand' : 'text-muted-foreground',
        )}
      >
        {formatDate(date)}
        {overdue > 0 && ` · atrasada há ${overdue} ${overdue === 1 ? 'dia' : 'dias'}`}
        {isToday && ' · hoje'}
      </p>
    </div>
  );
}
