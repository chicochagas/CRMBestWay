import { describe, expect, it } from 'vitest';
import { createDeal } from '@/lib/services/deals/createDeal';
import { updateDeal } from '@/lib/services/deals/updateDeal';
import { createFakeRepos, createStore, GESTOR, makeContact, makeDeal, VENDEDOR } from '../fakes/repositories';
import { expectCode } from '../helpers';

function setup() {
  const store = createStore();
  const contact = makeContact();
  store.contacts.push(contact);
  store.deals.push(makeDeal({ stageId: 's-novo', position: 0, contactId: contact.id }));
  return { store, contact, ctx: { repos: createFakeRepos(store), viewer: VENDEDOR } };
}

const base = { title: 'Novo deal', value: 5000, nextAction: 'Ligar', nextActionDate: '2026-10-01' };

describe('createDeal', () => {
  it('exige próxima ação e data (US3-1)', async () => {
    const { ctx, contact } = setup();
    await expectCode(createDeal(ctx, { ...base, contactId: contact.id, nextAction: '' }), 'NEXT_ACTION_REQUIRED');
    await expectCode(createDeal(ctx, { ...base, contactId: contact.id, nextActionDate: '' }), 'NEXT_ACTION_REQUIRED');
  });

  it('dono padrão é quem criou; nasce em Novo lead, no fim da coluna (US3-2)', async () => {
    const { ctx, contact, store } = setup();
    const { id } = await createDeal(ctx, { ...base, contactId: contact.id });
    const deal = store.deals.find((item) => item.id === id);
    expect(deal).toMatchObject({ ownerId: VENDEDOR.id, stageId: 's-novo', position: 1, status: 'open' });
  });

  it('contato inexistente → NOT_FOUND', async () => {
    const { ctx } = setup();
    await expectCode(createDeal(ctx, { ...base, contactId: 'nao-existe' }), 'NOT_FOUND');
  });

  it('não aceita dono inativo', async () => {
    const { ctx, contact, store } = setup();
    store.profiles.find((p) => p.id === GESTOR.id)!.active = false;
    await expectCode(createDeal(ctx, { ...base, contactId: contact.id, ownerId: GESTOR.id }), 'VALIDATION');
  });
});

describe('updateDeal', () => {
  it('troca o dono só para membro ativo e aceita deixar sem dono', async () => {
    const { ctx, store } = setup();
    const deal = store.deals[0]!;
    store.profiles.find((p) => p.id === GESTOR.id)!.active = false;
    await expectCode(updateDeal(ctx, { id: deal.id, ownerId: GESTOR.id }), 'VALIDATION');

    await updateDeal(ctx, { id: deal.id, ownerId: null });
    expect(store.deals[0]?.ownerId).toBeNull();
  });
});
