import { describe, expect, it } from 'vitest';
import { setNextAction } from '@/lib/services/deals/setNextAction';
import { createFakeRepos, createStore, makeContact, makeDeal, VENDEDOR } from '../fakes/repositories';
import { expectCode } from '../helpers';

function setup(dealOverrides = {}) {
  const store = createStore();
  const contact = makeContact();
  store.contacts.push(contact);
  const deal = makeDeal({ contactId: contact.id, nextAction: 'Ligar', nextActionDate: '2026-09-30', ...dealOverrides });
  store.deals.push(deal);
  return { store, deal, contact, ctx: { repos: createFakeRepos(store), viewer: VENDEDOR } };
}

describe('setNextAction', () => {
  it('exige próxima ação e data', async () => {
    const { ctx, deal } = setup();
    await expectCode(setNextAction(ctx, { dealId: deal.id, nextAction: '  ', nextActionDate: '2026-10-05' }), 'NEXT_ACTION_REQUIRED');
    await expectCode(setNextAction(ctx, { dealId: deal.id, nextAction: 'Enviar proposta', nextActionDate: '' }), 'NEXT_ACTION_REQUIRED');
  });

  it('não agenda ação em deal fechado', async () => {
    const { ctx, deal } = setup({ status: 'lost', lostReason: 'preço' });
    await expectCode(setNextAction(ctx, { dealId: deal.id, nextAction: 'X', nextActionDate: '2026-10-05' }), 'CONFLICT');
  });

  it('grava a nota da ação concluída antes da mudança de próxima ação (US1-2)', async () => {
    const { ctx, deal, store, contact } = setup();
    await setNextAction(ctx, {
      dealId: deal.id,
      nextAction: 'Enviar proposta',
      nextActionDate: '2026-10-06',
      completedNote: 'Liguei, pediu proposta',
    });

    expect(store.deals[0]).toMatchObject({ nextAction: 'Enviar proposta', nextActionDate: '2026-10-06' });
    expect(store.activities.map((a) => a.type)).toEqual(['note', 'next_action_change']);
    expect(store.activities[0]).toMatchObject({ content: 'Liguei, pediu proposta', contactId: contact.id });
    expect(store.activities[1]?.metadata).toEqual({
      from: { action: 'Ligar', date: '2026-09-30' },
      to: { action: 'Enviar proposta', date: '2026-10-06' },
    });
    expect(store.activities[1]?.author?.id).toBe(VENDEDOR.id);
  });

  it('sem nota, registra só a mudança de próxima ação', async () => {
    const { ctx, deal, store } = setup();
    await setNextAction(ctx, { dealId: deal.id, nextAction: 'Follow-up', nextActionDate: '2026-10-03' });
    expect(store.activities.map((a) => a.type)).toEqual(['next_action_change']);
  });
});
