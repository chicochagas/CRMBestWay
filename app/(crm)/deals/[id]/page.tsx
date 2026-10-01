import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ActivityTimeline } from '@/components/contacts/ActivityTimeline';
import { NoteForm } from '@/components/contacts/NoteForm';
import { DealActions } from '@/components/deals/DealActions';
import { DealForm } from '@/components/deals/DealForm';
import { NextActionBadge } from '@/components/deals/NextActionBadge';
import { NextActionForm } from '@/components/deals/NextActionForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getServiceContext } from '@/lib/actions/context';
import { addDays, todayInSaoPaulo } from '@/lib/dates';
import { LOST_REASON_LABELS } from '@/lib/domain';
import { formatBRL, formatDate } from '@/lib/format';
import { getTimeline } from '@/lib/services/activities/activities';

const STATUS_LABEL = { open: 'Em aberto', won: 'Ganho', lost: 'Perdido', standby: 'Stand-by' } as const;

export default async function DealPage({ params }: PageProps<'/deals/[id]'>) {
  const { id } = await params;
  const ctx = await getServiceContext();
  const deal = await ctx.repos.deals.getById(id);
  if (!deal) notFound();

  const today = todayInSaoPaulo();
  const [stages, members, timeline] = await Promise.all([
    ctx.repos.stages.listOrdered(),
    ctx.repos.profiles.listActive(),
    getTimeline(ctx, { dealId: deal.id }),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="grid content-start gap-6">
        <header>
          <p className="text-sm text-muted-foreground">
            <Link href="/pipeline" className="hover:underline">
              Pipeline
            </Link>{' '}
            · {deal.stage.name} · {STATUS_LABEL[deal.status]}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{deal.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link href={`/contacts/${deal.contact.id}`} className="font-medium text-foreground hover:underline">
              {deal.contact.name}
            </Link>
            {deal.company && (
              <>
                {' · '}
                <Link href={`/companies/${deal.company.id}`} className="hover:underline">
                  {deal.company.name}
                </Link>
              </>
            )}
            {' · '}
            {formatBRL(deal.value)} · Dono: {deal.owner?.name ?? 'sem dono'}
          </p>
          {deal.status === 'won' && (
            <p className="mt-2 text-sm font-medium text-brand">
              Ganho · {deal.dealType === 'recorrente' ? `Recorrente, MRR ${formatBRL(deal.mrr)}` : 'Pontual'}
            </p>
          )}
          {deal.status === 'lost' && deal.lostReason && (
            <p className="mt-2 text-sm font-medium">Perdido · motivo: {LOST_REASON_LABELS[deal.lostReason]}</p>
          )}
          {deal.status === 'standby' && (
            <p className="mt-2 text-sm font-medium">Stand-by · reaquecer em {formatDate(deal.reaquecerEm)}</p>
          )}
          <div className="mt-4">
            <DealActions deal={deal} stages={stages} today={today} canDelete={ctx.viewer.role === 'gestor'} />
          </div>
        </header>

        {deal.status === 'open' && (
          <Card className="rounded-card">
            <CardHeader>
              <CardTitle>Próxima ação</CardTitle>
              <NextActionBadge action={deal.nextAction} date={deal.nextActionDate} today={today} className="text-sm" />
            </CardHeader>
            <CardContent>
              <NextActionForm dealId={deal.id} defaultAction={deal.nextAction} defaultDate={addDays(today, 1)} />
            </CardContent>
          </Card>
        )}

        <Card className="rounded-card">
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <NoteForm dealId={deal.id} />
            <ActivityTimeline items={timeline} />
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit rounded-card">
        <CardHeader>
          <CardTitle>Dados do deal</CardTitle>
        </CardHeader>
        <CardContent>
          <DealForm deal={deal} members={members} />
        </CardContent>
      </Card>
    </div>
  );
}
