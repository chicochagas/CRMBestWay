import { redirect } from 'next/navigation';
import { SetPasswordForm } from '@/components/auth/SetPasswordForm';
import { createClient } from '@/lib/supabase/server';

export default async function SetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?erro=convite');

  return (
    <>
      <h1 className="text-xl font-bold">Defina sua senha</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">Você vai usar esta senha para entrar no CRM.</p>
      <SetPasswordForm />
    </>
  );
}
