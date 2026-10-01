import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { publicEnv } from '@/lib/env';
import { getServerEnv } from '@/lib/env.server';
import type { Database } from './types';

/**
 * Cliente com a secret key: ignora a RLS. Único ponto do app que importa a chave.
 * Usado só para convidar, banir e cadastrar o perfil de membros (lib/integrations/authAdmin.ts).
 */
export function createAdminClient() {
  return createClient<Database>(publicEnv.supabaseUrl, getServerEnv().supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
