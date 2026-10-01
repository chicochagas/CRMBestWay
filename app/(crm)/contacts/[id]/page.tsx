import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ActivityTimeline } from '@/components/contacts/ActivityTimeline';
import { ContactForm } from '@/components/contacts/ContactForm';
import { NoteForm } from '@/components/contacts/NoteForm';
import { NextActionBadge } from '@/components/deals/NextActionBadge';
import { NewLeadDialog } from '@/components/leads/NewLeadDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getServiceContext } from '@/lib/actions/context';
import { todayInSaoPaulo } from '@/lib/dates';
import { formatBRL } from '@/lib/format';
import { getTimeline } from '@/lib/services/activities/activities';

export default async function ContactPage({ params }: PageProps<'/contacts/[id]'>) {
  const { id } = await params;
  const ctx = await getServiceContext();
  const contact = await ctx.repos.contacts.getById(id);
  if (!contact) notFound();

  const today = todayInSaoPaulo();
  const [deals, timeline, members] = await Promise.all([
    ctx.repos.deals.listByContact(contact.id),
    getTimeline(ctx, { contactId: contact.id }),
    ctx.repos.profiles.listActive(),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="grid content-start gap-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              <Link href="/contacts" className="hover:underline">
                Contatos
              </Link>
              {contact.company && (
                <>
                  {' · '}
                  <Link href={`/companies/${contact.company.id}`} className="hover:underline">
                    {contact.company.name}
                  </Link>
                </>
              )}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{contact.name}</h1>
          </div>
          <NewLeadDialog
            members={members}
            currentUserId={ctx.viewer.id}
            today={today}
            fixedContact={{ id: contact.id, name: contact.name }}
            triggerLabel="Novo deal"
          />
        </header>

        <Card className="rounded-card">
          <CardHeader>
            <CardTitle>Deals ({deals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {deals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum deal para este contato.</p>
            ) : (
              <ul className="divide-y divide-border">
                {deals.map((deal) => (
                  <li key={deal.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                    <div>
                      <Link href={`/deals/${deal.id}`} className="font-medium hover:underline">
                        {deal.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {deal.stage.name} · {formatBRL(deal.value)} · {deal.owner?.name ?? 'sem dono'}
                      </p>
                    </div>
                    {deal.status === 'open' && (
                      <NextActionBadge action={deal.nextAction} date={deal.nextActionDate} today={today} className="text-right" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-card">
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <NoteForm contactId={contact.id} />
            <ActivityTimeline items={timeline} showDealLink />
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit rounded-card">
        <CardHeader>
          <CardTitle>Dados do contato</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactForm contact={contact} hasDeals={deals.length > 0} />
        </CardContent>
      </Card>
    </div>
  );
}
