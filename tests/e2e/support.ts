import { expect, type Page } from '@playwright/test';

export const hasCredentials = Boolean(process.env.E2E_VENDEDOR_EMAIL && process.env.E2E_VENDEDOR_PASSWORD);

export async function loginAsVendedor(page: Page) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(process.env.E2E_VENDEDOR_EMAIL!);
  await page.getByLabel('Senha').fill(process.env.E2E_VENDEDOR_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/pipeline/);
}

export function isoDate(offsetDays = 0): string {
  const date = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(date);
}
