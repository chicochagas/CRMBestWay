'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { NextActionBadge } from '@/components/deals/NextActionBadge';
import type { DealCard } from '@/lib/domain';
import { formatBRL } from '@/lib/format';
import { cn } from '@/lib/utils';

export function KanbanCard({ deal, today }: { deal: DealCard; today: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'touch-none rounded-xl border border-border bg-card p-3 shadow-xs',
        isDragging && 'opacity-60 shadow-md ring-2 ring-ring/40',
      )}
      {...attributes}
      {...listeners}
    >
      <Link
        href={`/deals/${deal.id}`}
        className="block text-sm font-semibold leading-snug hover:underline"
        onPointerDown={(event) => event.stopPropagation()}
      >
        {deal.title}
      </Link>
      <p className="mt-1 truncate text-xs text-muted-foreground">
        {deal.contact.name}
        {deal.company && ` · ${deal.company.name}`}
      </p>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-semibold">{formatBRL(deal.value)}</span>
        <span className={cn('truncate', !deal.owner && 'italic text-muted-foreground')}>
          {deal.owner?.name ?? 'Sem dono'}
        </span>
      </div>
      {deal.status === 'open' && (
        <NextActionBadge action={deal.nextAction} date={deal.nextActionDate} today={today} className="mt-2 border-t border-border pt-2" />
      )}
    </li>
  );
}
