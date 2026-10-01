'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { DealCard, Stage } from '@/lib/domain';
import { formatBRL } from '@/lib/format';
import { cn } from '@/lib/utils';
import { KanbanCard } from './KanbanCard';

export function KanbanColumn({ stage, deals, today }: { stage: Stage; deals: DealCard[]; today: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = deals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <section
      aria-label={stage.name}
      className={cn(
        'flex max-h-[calc(100vh-12rem)] w-72 shrink-0 flex-col rounded-card border border-border bg-muted/60',
        isOver && 'ring-2 ring-ring/40',
      )}
    >
      <header className="border-b border-border px-3 py-3">
        <div className="flex items-center gap-2">
          <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: stage.color ?? '#A1A1AA' }} />
          <h2 className="truncate text-sm font-semibold">{stage.name}</h2>
          <span className="ml-auto rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground">{stage.probability}%</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {deals.length} {deals.length === 1 ? 'deal' : 'deals'} · {formatBRL(total)}
        </p>
      </header>
      <SortableContext items={deals.map((deal) => deal.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto p-2">
          {deals.map((deal) => (
            <KanbanCard key={deal.id} deal={deal} today={today} />
          ))}
        </ul>
      </SortableContext>
    </section>
  );
}
