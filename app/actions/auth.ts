'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// O login NÃO é Server Action: roda no client direto no Supabase Auth para herdar o
// rate limit por IP do usuário (constituição §IV). Aqui fica só o logout.
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
