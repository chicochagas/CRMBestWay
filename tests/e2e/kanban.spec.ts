import { expect, test } from '@playwright/test';
import { hasCredentials, loginAsVendedor } from './support';

test.describe('Kanban', () => {
  test.skip(!hasCredentials, 'Defina E2E_VENDEDOR_EMAIL/E2E_VENDEDOR_PASSWORD');

  test('mostra as 9 etapas com probabilidade (quickstart 11)', async ({ page }) => {
    await loginAsVendedor(page);
    for (const name of ['Novo lead', 'Qualificado', 'Diagnóstico agendado', 'Negociação', 'Ganho', 'Perdido', 'Stand-by']) {
      await expect(page.getByRole('region', { name, exact: true })).toBeVisible();
    }
  });

  test('arrastar para Ganho abre o diálogo e cancelar devolve o card (quickstart 12)', async ({ page }) => {
    await loginAsVendedor(page);
    const card = page.getByRole('region', { name: 'Negociação', exact: true }).getByRole('listitem').first();
    test.skip((await card.count()) === 0, 'Sem deal em Negociação; rode o seed.dev.sql');

    const title = await card.getByRole('link').innerText();
    await card.dragTo(page.getByRole('region', { name: 'Ganho', exact: true }));
    await expect(page.getByRole('dialog', { name: 'Marcar como ganho' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancelar' }).click();

    await expect(
      page.getByRole('region', { name: 'Negociação', exact: true }).getByRole('link', { name: title }),
    ).toBeVisible();
  });
});
