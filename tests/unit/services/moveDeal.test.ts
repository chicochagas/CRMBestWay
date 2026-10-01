import { describe, expect, it } from 'vitest';
import { moveDeal } from '@/lib/services/deals/moveDeal';
import { createFakeRepos, createStore, makeContact, makeDeal, VENDEDOR } from '../fakes/repositories';

function setup(dealOverrides = {}) {
  const store = createStore();
  const contact = makeContact({ origem: 'inbound' });
  store.contacts.push(contact);
  const deal = makeDeal({ contactId: contact.id, ...dealOverrides });
  store.deals.push(deal);
  return { store, deal, ctx: { repos: createFakeRepos(store), viewer: VENDEDOR } };
}

describe('moveDeal (etapas em aberto)', () => {
  it('move numa única chamada e registra a mudança de etapa (US2-2)', async () => {
    const { ctx, store, deal } = setup({ stageId: 's-real' });
    await moveDeal(ctx, { dealId: deal.id, toStageId: 's-neg', toIndex: 2, today: '2026-10-01' });

    expect(store.moves).toEqual([{ dealId: deal.id, stageId: 's-neg', index: 2, patch: {} }]);
    expect(store.activities).toHaveLength(1);
    expect(store.activities[0]).toMatchObject({ type: 'stage_change', dealId: deal.id, contactId: deal.contactId });
    expect(store.activities[0]?.metadata).toEqual({
      from_stage_id: 's-real',
      to_stage_id: 's-neg',
      from_name: 'Diagnóstico realizado',
      to_name: 'Negociação',
    });
  });

  it('preenche qualified_at ao entrar em Qualificado, sem sobrescrever', async () => {
    const { ctx, store, deal } = setup();
    await moveDeal(ctx, { dealId: deal.id, toStageId: 's-qual', toIndex: 0, today: '2026-10-01' });
    expect(store.moves[0]?.patch).toHaveProperty('qualifiedAt');

    const already = setup({ qualifiedAt: '2026-09-01T00:00:00Z', stageId: 's-neg' });
    await moveDeal(already.ctx, { dealId: already.deal.id, toStageId: 's-qual', toIndex: 0, today: '2026-10-01' });
    expect(already.store.moves[0]?.patch).toEqual({});
  });

  it('reordenar na mesma coluna não gera stage_change (US2-3)', async () => {
    const { ctx, store, deal } = setup({ stageId: 's-neg' });
    await moveDeal(ctx, { dealId: deal.id, toStageId: 's-neg', toIndex: 0, today: '2026-10-01' });
    expect(store.moves).toHaveLength(1);
    expect(store.activities).toHaveLength(0);
  });
});
