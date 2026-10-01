import { expect, test } from '@playwright/test';
import { hasCredentials, isoDate, loginAsVendedor } from './support';

test.describe('Hoje', () => {
  test.skip(!hasCredentials, 'Defina E2E_VENDEDOR_EMAIL/E2E_VENDEDOR_PASSWORD');

  test('reagendar para +5 dias tira o item da lista (quickstart 7)', async ({ page }) => {
    await loginAsVendedor(page);
    await page.goto('/hoje');

    const first = page.getByRole('listitem').filter({ has: page.getByRole('button', { name: 'Concluir e reagendar' }) }).first();
    test.skip((await first.count()) === 0, 'Sem itens em Hoje; rode o seed.dev.sql');

    const title = await first.getByRole('link').first().innerText();
    await first.getByRole('button', { name: 'Concluir e reagendar' }).click();
    await first.getByLabel('O que foi feito (opcional)').fill('Concluído pelo E2E');
    await first.getByLabel('Próxima ação').fill('Retomar contato');
    await first.getByLabel('Data').fill(isoDate(5));
    await first.getByRole('button', { name: 'Salvar próxima ação' }).click();

    await expect(page.getByRole('link', { name: title, exact: true })).toHaveCount(0);
  });
});
