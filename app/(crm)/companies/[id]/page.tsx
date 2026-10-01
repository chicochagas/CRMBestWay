import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CompanyForm } from '@/components/contacts/CompanyForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getServiceContext } from '@/lib/actions/context';

export default async function CompanyPage({ params }: PageProps<'/companies/[id]'>) {
  const { id } = await params;
  const ctx = await getServiceContext();
  const company = await ctx.repos.companies.getById(id);
  if (!company) notFound();
  const contacts = await ctx.repos.contacts.listByCompany(company.id);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="grid content-start gap-6">
        <header>
          <p className="text-sm text-muted-foreground">
            <Link href="/contacts" className="hover:underline">
              Contatos e empresas
            </Link>
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{company.name}</h1>
          {company.domain && <p className="text-sm text-muted-foreground">{company.domain}</p>}
        </header>
        <Card className="rounded-card">
          <CardHeader>
            <CardTitle>Contatos ({contacts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum contato nesta empresa.</p>
            ) : (
              <ul className="divide-y divide-border">
                {contacts.map((contact) => (
                  <li key={contact.id} className="py-2.5">
                    <Link href={`/contacts/${contact.id}`} className="font-medium hover:underline">
                      {contact.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{contact.email}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      <Card className="h-fit rounded-card">
        <CardHeader>
          <CardTitle>Dados da empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <CompanyForm company={company} />
        </CardContent>
      </Card>
    </div>
  );
}
