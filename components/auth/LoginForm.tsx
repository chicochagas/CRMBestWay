'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Field } from '@/components/common/Field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/browser';

/** Só aceita caminhos internos (evita open redirect via ?next=). */
function safeNext(next?: string): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

/**
 * Login direto no Supabase Auth, no browser: herda o rate limit por IP do usuário
 * (constituição §IV). Qualquer falha de credencial, inclusive membro banido, vira a mesma mensagem.
 */
export function LoginForm({ next, signOutFirst }: { next?: string; signOutFirst?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // Sessão de membro desativado: encerra no client (Server Components não gravam cookies).
    if (signOutFirst) void createClient().auth.signOut();
  }, [signOutFirst]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    const { error: authError } = await createClient().auth.signInWithPassword({
      email: String(form.get('email') ?? '').trim(),
      password: String(form.get('password') ?? ''),
    });

    if (authError) {
      setPending(false);
      const rateLimited = authError.status === 429 || authError.code === 'over_request_rate_limit';
      setError(rateLimited ? 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' : 'E-mail ou senha inválidos.');
      return;
    }

    router.replace(safeNext(next));
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <Field label="E-mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </Field>
      <Field label="Senha" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
}
