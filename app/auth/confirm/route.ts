import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ACCEPTED: EmailOtpType[] = ['invite', 'recovery', 'email'];

/** Link do e-mail de convite: valida o token, cria a sessão e leva o convidado a definir a senha. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  if (tokenHash && type && ACCEPTED.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL('/definir-senha', request.url));
  }

  return NextResponse.redirect(new URL('/login?erro=convite', request.url));
}
