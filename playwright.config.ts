import { defineConfig, devices } from '@playwright/test';

// E2E contra um projeto/branch Supabase de TESTE (variáveis em .env.test).
// Precisa de E2E_VENDEDOR_EMAIL/E2E_VENDEDOR_PASSWORD de um usuário já convidado.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: 'npm run dev', url: 'http://localhost:3000/login', reuseExistingServer: true, timeout: 120_000 },
});
