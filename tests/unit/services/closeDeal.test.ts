import { describe, expect, it } from 'vitest';
import { closeDeal } from '@/lib/services/deals/closeDeal';
import { reopenDeal } from '@/lib/services/deals/reopenDeal';
import { deleteDeal } from '@/lib/services/deals/updateDeal';
import { createFakeRepos, createStore, GESTOR, makeContact, makeDeal, VENDEDOR } from '../fakes/repositories';
import { expectCode } from '../helpers';

function setup(dealOverrides = {}) {
  const store = createStore();
  const contact = makeContact({ origem: 'inbound' });
  store.contacts.push(contact);
  const deal = makeDeal({ contactId: contact.id, stageId: 's-neg', ...dealOverrides });
  store.deals.push(deal);
  return { store, deal, repos: createFakeRepos(store) };
}

describe('closeDeal', () => {
  it('grava status e dados de fechamento no mesmo movimento', async () => {
    const { repos, store, deal } = setup();
    const result = await closeDeal(
      { repos, viewer: VENDEDOR },
      { dealId: deal.id, toStageId: 's-ganho', toIndex: 0, won: { dealType: 'recorrente', mrr: 4000 }, today: '2026-10-01' },
    );
    expect(result.status).toBe('won');
    expect(store.moves).toHaveLength(1);
    expect(store.moves[0]?.patch).toEqual({ status: 'won', dealType: 'recorrente', mrr: 4000 });
    expect(store.activities.map((a) => a.type)).toEqual(['stage_change']);
  });

  it('sem os dados, não move nada', async () => {
    const { repos, store, deal } = setup();
    await expectCode(
      closeDeal({ repos, viewer: VENDEDOR }, { dealId: deal.id, toStageId: 's-perdido', toIndex: 0, today: '2026-10-01' }),
      'LOST_REASON_REQUIRED',
    );
    expect(store.moves).toHaveLength(0);
  });
});

describe('reopenDeal', () => {
  it('limpa motivo/data e registra etapa e próxima ação', async () => {
    const { repos, store, deal } = setup({ stageId: 's-perdido', status: 'lost', lostReason: 'timing' });
    const result = await reopenDeal(
      { repos, viewer: VENDEDOR },
      { dealId: deal.id, toStageId: 's-neg', toIndex: 0, nextAction: 'Retomar', nextActionDate: '2026-10-05', today: '2026-10-01' },
    );
    expect(result.status).toBe('open');
    expect(store.deals[0]).toMatchObject({ status: 'open', lostReason: null, reaquecerEm: null, nextAction: 'Retomar' });
    expect(store.activities.map((a) => a.type)).toEqual(['stage_change', 'next_action_change']);
  });
});

describe('deleteDeal', () => {
  it('só gestor exclui (FR-008)', async () => {
    const { repos, store, deal } = setup();
    await expectCode(deleteDeal({ repos, viewer: VENDEDOR }, { id: deal.id }), 'FORBIDDEN');
    await deleteDeal({ repos, viewer: GESTOR }, { id: deal.id });
    expect(store.deals).toHaveLength(0);
  });
});
