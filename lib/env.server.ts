import 'server-only';
import { z } from 'zod';

// Segredos: só no servidor, nunca em NEXT_PUBLIC_* (constituição §IV).
// Validados na primeira leitura; a falha cita o nome da variável, nunca o valor.
const serverSchema = z.object({
  // Chave nova (sb_secret_…) ou a service role legada (JWT); qualquer uma serve ao Auth admin.
  SUPABASE_SECRET_KEY: z.string().min(1),
  SITE_URL: z.url(),
});

type ServerEnv = { supabaseSecretKey: string; siteUrl: string };

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverSchema.safeParse({
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    SITE_URL:
      process.env.SITE_URL ||
      (process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000'),
  });

  if (!parsed.success) {
    const missing = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Variáveis de ambiente de servidor inválidas ou ausentes: ${missing}. Veja .env.example.`);
  }

  cached = {
    supabaseSecretKey: parsed.data.SUPABASE_SECRET_KEY,
    siteUrl: parsed.data.SITE_URL.replace(/\/$/, ''),
  };
  return cached;
}
