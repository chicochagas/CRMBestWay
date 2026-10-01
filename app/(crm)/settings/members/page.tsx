import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/common/PageHeader';
import { InviteMemberForm } from '@/components/settings/InviteMemberForm';
import { MembersTable } from '@/components/settings/MembersTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getServiceContext } from '@/lib/actions/context';
import { createAuthAdmin } from '@/lib/integrations/authAdmin';

export default async function MembersPage() {
  const ctx = await getServiceContext();
  if (ctx.viewer.role !== 'gestor') notFound();

  const [profiles, emails] = await Promise.all([ctx.repos.profiles.listAll(), createAuthAdmin().listEmails()]);
  const members = profiles.map((profile) => ({ ...profile, email: emails[profile.id] ?? '—' }));

  return (
    <>
      <PageHeader title="Membros do time" subtitle="Só gestores convidam, mudam papéis e desativam membros." />
      <div className="grid gap-6">
        <Card className="rounded-card">
          <CardHeader>
            <CardTitle>Convidar membro</CardTitle>
          </CardHeader>
          <CardContent>
            <InviteMemberForm />
          </CardContent>
        </Card>
        <Card className="rounded-card">
          <CardContent className="pt-6">
            <MembersTable members={members} currentUserId={ctx.viewer.id} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
