// Aplica as migrations (e o seed) no banco de DATABASE_URL.
// Uso: npm run db:push  (o .env é carregado por `node --env-file=.env`).
// Roda o CLI pelo próprio Node, sem shell, para a URL não precisar de escape.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL não definida no .env (Supabase → Connect → Connection string).');
  process.exit(1);
}

const require = createRequire(import.meta.url);
const cliEntry = path.join(path.dirname(require.resolve('supabase/package.json')), 'dist', 'supabase.js');

const result = spawnSync(process.execPath, [cliEntry, 'db', 'push', '--db-url', dbUrl, '--include-seed'], {
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
