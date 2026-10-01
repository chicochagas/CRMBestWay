import 'server-only';
import { getViewer } from '@/lib/auth/getViewer';
import type { ServiceContext } from '@/lib/services/context';
import { createRepos } from '@/lib/supabase/repositories';
import { createClient } from '@/lib/supabase/server';

/** Contexto de serviço para Server Actions e Server Components: sessão + repositórios com RLS. */
export async function getServiceContext(): Promise<ServiceContext> {
  const [viewer, db] = await Promise.all([getViewer(), createClient()]);
  return { viewer, repos: createRepos(db) };
}
