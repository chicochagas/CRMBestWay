import { expect, test } from '@playwright/test';
import { hasCredentials, isoDate, loginAsVendedor } from './support';

test('sem sessão, qualquer tela leva ao login (quickstart 1)', async ({ page }) => {
  await page.goto('/pipeline');
  await expect(page).toHaveURL(/\/login\?next=%2Fpipeline/);
});

test.describe('cadastro de lead', () => {
  test.skip(!hasCredentials, 'Defina E2E_VENDEDOR_EMAIL/E2E_VENDEDOR_PASSWORD');

  test('bloqueia sem próxima ação e cadastra lead que aparece em Hoje (quickstart 3–4)', async ({ page }) => {
    const suffix = Date.now();
    await loginAsVendedor(page);
    await page.getByRole('button', { name: 'Novo lead' }).click();

    await page.getByLabel('Nome', { exact: true }).fill(`Lead E2E ${suffix}`);
    await page.getByLabel('E-mail').fill(`e2e-${suffix}@example.invalid`);
    await page.getByLabel('Nome da empresa').fill(`Empresa E2E ${suffix}`);
    await page.getByLabel('Título').fill(`Deal E2E ${suffix}`);
    await page.getByRole('button', { name: 'Cadastrar' }).click();
    await expect(page.getByText('Informe a próxima ação.')).toBeVisible();

    await page.getByLabel('Próxima ação').fill('Ligar hoje');
    await page.getByLabel('Data').fill(isoDate(0));
    await page.getByRole('button', { name: 'Cadastrar' }).click();
    await expect(page).toHaveURL(/\/deals\//);

    await page.getByRole('link', { name: /Hoje/ }).click();
    await expect(page.getByText(`Deal E2E ${suffix}`)).toBeVisible();
  });
});
