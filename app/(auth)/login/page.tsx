import { LoginForm } from '@/components/auth/LoginForm';

const NOTICES: Record<string, string> = {
  inativo: 'Seu acesso está desativado. Fale com o gestor do time.',
  convite: 'Convite inválido ou expirado. Peça um novo ao gestor.',
};

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const params = await searchParams;
  const next = typeof params.next === 'string' ? params.next : undefined;
  const erro = typeof params.erro === 'string' ? params.erro : undefined;

  return (
    <>
      <h1 className="text-xl font-bold">Entrar</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">Use o e-mail e a senha do seu convite.</p>
      {erro && NOTICES[erro] && (
        <p role="status" className="mb-4 rounded-md bg-muted px-3 py-2 text-sm">
          {NOTICES[erro]}
        </p>
      )}
      <LoginForm next={next} signOutFirst={erro === 'inativo'} />
    </>
  );
}
