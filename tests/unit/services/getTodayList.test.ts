import { describe, expect, it } from 'vitest';
import { getTodayList } from '@/lib/services/today/getTodayList';
import { createFakeRepos, createStore, GESTOR, makeDeal, VENDEDOR } from '../fakes/repositories';

const TODAY = '2026-10-01';

function scenario() {
  const store = createStore();
  store.deals.push(
    makeDeal({ id: 'hoje-1', nextActionDate: TODAY, updatedAt: '2026-09-02T00:00:00Z' }),
    makeDeal({ id: 'hoje-2', nextActionDate: TODAY, updatedAt: '2026-09-03T00:00:00Z' }),
    makeDeal({ id: 'atrasado', nextActionDate: '2026-09-28' }),
    makeDeal({ id: 'amanha', nextActionDate: '2026-10-02' }),
    makeDeal({ id: 'ganho', nextActionDate: '2026-09-01', status: 'won' }),
    makeDeal({ id: 'do-gestor', nextActionDate: '2026-09-20', ownerId: GESTOR.id }),
    makeDeal({ id: 'sem-dono', nextActionDate: '2026-09-25', ownerId: null }),
  );
  return createFakeRepos(store);
}

describe('getTodayList', () => {
  it('lista atrasados primeiro (com dias) e depois os de hoje; ignora o futuro (US1-1)', async () => {
    const items = await getTodayList({ repos: scenario(), viewer: VENDEDOR }, { today: TODAY });
    expect(items.map((item) => item.dealId)).toEqual(['atrasado', 'hoje-1', 'hoje-2']);
    expect(items[0]?.daysOverdue).toBe(3);
    expect(items[1]?.daysOverdue).toBe(0);
  });

  it('não mostra deals fechados nem de outro vendedor (US1-3, US4-5)', async () => {
    const items = await getTodayList({ repos: scenario(), viewer: VENDEDOR }, { today: TODAY });
    expect(items.map((item) => item.dealId)).not.toContain('ganho');
    expect(items.map((item) => item.dealId)).not.toContain('do-gestor');
  });

  it('vendedor pedindo o time continua vendo só os seus', async () => {
    const items = await getTodayList({ repos: scenario(), viewer: VENDEDOR }, { today: TODAY, owner: 'team' });
    expect(items).toHaveLength(3);
  });

  it('gestor vê os próprios por padrão, filtra por vendedor e vê o time com deals sem dono (US1-4)', async () => {
    const repos = scenario();
    const mine = await getTodayList({ repos, viewer: GESTOR }, { today: TODAY });
    expect(mine.map((item) => item.dealId)).toEqual(['do-gestor']);

    const seller = await getTodayList({ repos, viewer: GESTOR }, { today: TODAY, owner: VENDEDOR.id });
    expect(seller).toHaveLength(3);

    const team = await getTodayList({ repos, viewer: GESTOR }, { today: TODAY, owner: 'team' });
    expect(team.map((item) => item.dealId)).toContain('sem-dono');
    expect(team).toHaveLength(5);
  });

  it('devolve lista vazia quando o vendedor está em dia (US1-5)', async () => {
    const store = createStore();
    store.deals.push(makeDeal({ nextActionDate: '2026-10-10' }));
    const items = await getTodayList({ repos: createFakeRepos(store), viewer: VENDEDOR }, { today: TODAY });
    expect(items).toEqual([]);
  });
});
