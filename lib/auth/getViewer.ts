import 'server-only';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import type { Role, Viewer } from '@/lib/domain';
import { createClient } from '@/lib/supabase/server';

/**
 * Usuário logado + perfil. Sem sessão → /login. Sem perfil ou inativo → /login?erro=inativo
 * (a RLS já esconde o próprio perfil de quem está inativo; o LoginForm encerra a sessão).
 * `cache` deduplica a chamada dentro da mesma requisição.
 */
export const getViewer = cache(async (): Promise<Viewer> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, role, active')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.active) redirect('/login?erro=inativo');

  return {
    id: profile.id,
    name: profile.name,
    role: profile.role as Role,
    active: profile.active,
    email: user.email ?? null,
  };
});
