'use client';

import { Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { NextActionForm } from '@/components/deals/NextActionForm';
import { Button } from '@/components/ui/button';
import { addDays } from '@/lib/dates';
import { formatBRL, formatDate } from '@/lib/format';
import type { TodayItem as TodayItemData } from '@/lib/services/today/getTodayList';
import { cn } from '@/lib/utils';

export function TodayItem({ item, today, showOwner }: { item: TodayItemData; today: string; showOwner: boolean }) {
  const [editing, setEditing] = useState(false);
  const overdue = item.daysOverdue > 0;

  return (
    <li
      className={cn(
        'rounded-card border bg-card p-4 shadow-xs',
        overdue ? 'border-danger/40' : 'border-border',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={cn('text-xs font-semibold', overdue ? 'text-danger' : 'text-brand')}>
            {overdue
              ? `Atrasada há ${item.daysOverdue} ${item.daysOverdue === 1 ? 'dia' : 'dias'} · ${formatDate(item.nextActionDate)}`
              : 'Para hoje'}
          </p>
          <p className="mt-1 text-base font-semibold">{item.nextAction}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link href={`/deals/${item.dealId}`} className="font-medium text-foreground underline-offset-2 hover:underline">
              {item.title}
            </Link>
            {' · '}
            {item.stage.name} · {formatBRL(item.value)}
            {showOwner && ` · ${item.owner?.name ?? 'Sem dono'}`}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <Link href={`/contacts/${item.contact.id}`} className="font-medium hover:underline">
              {item.contact.name}
            </Link>
            {item.contact.phone && (
              <a href={`tel:${item.contact.phone}`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                <Phone className="size-3.5" aria-hidden /> {item.contact.phone}
              </a>
            )}
            <a href={`mailto:${item.contact.email}`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <Mail className="size-3.5" aria-hidden /> {item.contact.email}
            </a>
          </div>
        </div>
        {!editing && (
          <Button onClick={() => setEditing(true)} size="sm">
            Concluir e reagendar
          </Button>
        )}
      </div>

      {editing && (
        <div className="mt-4 border-t border-border pt-4">
          <NextActionForm
            dealId={item.dealId}
            defaultDate={addDays(today, 1)}
            onDone={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}
    </li>
  );
}
