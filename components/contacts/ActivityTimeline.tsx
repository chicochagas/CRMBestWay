import { ArrowRightLeft, CalendarClock, FileText, MessageSquare, Phone, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Activity } from '@/lib/domain';
import { formatDate, formatDateTime } from '@/lib/format';

type NextActionMeta = { from?: { action?: string | null; date?: string | null }; to?: { action?: string | null; date?: string | null } };

function describe(activity: Activity): { icon: ReactNode; title: string; body?: string | null } {
  const meta = activity.metadata;
  switch (activity.type) {
    case 'note':
      return { icon: <FileText className="size-4" />, title: 'Nota', body: activity.content };
    case 'call_note':
      return { icon: <Phone className="size-4" />, title: 'Nota de call', body: activity.content };
    case 'stage_change':
      return {
        icon: <ArrowRightLeft className="size-4" />,
        title: `Mudou de etapa: ${String(meta.from_name ?? '—')} → ${String(meta.to_name ?? '—')}`,
      };
    case 'next_action_change': {
      const { from, to } = meta as NextActionMeta;
      const fmt = (item?: { action?: string | null; date?: string | null }) =>
        item?.action ? `${item.action} (${formatDate(item.date)})` : '—';
      return { icon: <CalendarClock className="size-4" />, title: `Próxima ação: ${fmt(from)} → ${fmt(to)}` };
    }
    default:
      return { icon: <Sparkles className="size-4" />, title: 'Atividade', body: activity.content };
  }
}

/** Histórico do deal ou do contato, mais recente primeiro, com autor e data/hora (FR-027, FR-028). */
export function ActivityTimeline({ items, showDealLink = false }: { items: Activity[]; showDealLink?: boolean }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma atividade ainda.</p>;

  return (
    <ol className="grid gap-4">
      {items.map((activity) => {
        const { icon, title, body } = describe(activity);
        return (
          <li key={activity.id} className="flex gap-3">
            <span aria-hidden className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              {activity.type === 'call_note' ? <MessageSquare className="size-4" /> : icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{title}</p>
              {body && <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{body}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {activity.author?.name ?? 'Sistema'} · {formatDateTime(activity.createdAt)}
                {showDealLink && activity.dealId && (
                  <>
                    {' · '}
                    <a href={`/deals/${activity.dealId}`} className="underline">
                      ver deal
                    </a>
                  </>
                )}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
