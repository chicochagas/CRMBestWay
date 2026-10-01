import Link from 'next/link';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchBox } from '@/components/contacts/SearchBox';
import { NewLeadDialog } from '@/components/leads/NewLeadDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getServiceContext } from '@/lib/actions/context';
import { todayInSaoPaulo } from '@/lib/dates';

export default async function ContactsPage({ searchParams }: PageProps<'/contacts'>) {
  const ctx = await getServiceContext();
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';

  const [contacts, companies, members] = await Promise.all([
    ctx.repos.contacts.search(q),
    ctx.repos.companies.search(q),
    ctx.repos.profiles.listActive(),
  ]);

  return (
    <>
      <PageHeader
        title="Contatos e empresas"
        subtitle="Busque por nome, e-mail, empresa ou domínio."
        actions={<NewLeadDialog members={members} currentUserId={ctx.viewer.id} today={todayInSaoPaulo()} />}
      />
      <div className="mb-6">
        <SearchBox q={q} placeholder="Buscar contatos e empresas" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-card">
          <CardHeader>
            <CardTitle>Contatos ({contacts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum contato encontrado.</p>
            ) : (
              <ul className="divide-y divide-border">
                {contacts.map((contact) => (
                  <li key={contact.id} className="py-2.5">
                    <Link href={`/contacts/${contact.id}`} className="font-medium hover:underline">
                      {contact.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {contact.email}
                      {contact.company && ` · ${contact.company.name}`} · {contact.origem}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-card">
          <CardHeader>
            <CardTitle>Empresas ({companies.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {companies.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma empresa encontrada.</p>
            ) : (
              <ul className="divide-y divide-border">
                {companies.map((company) => (
                  <li key={company.id} className="py-2.5">
                    <Link href={`/companies/${company.id}`} className="font-medium hover:underline">
                      {company.name}
                    </Link>
                    {company.domain && <p className="text-xs text-muted-foreground">{company.domain}</p>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
