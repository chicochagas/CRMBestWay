import { describe, expect, it } from 'vitest';
import { getBoard } from '@/lib/services/deals/getBoard';
import { createFakeRepos, createStore, GESTOR, makeContact, makeDeal } from '../fakes/repositories';

function setup() {
  const store = createStore();
  store.companies.push({ id: 'co-1', name: 'Açaí Data', domain: null });
  store.contacts.push(makeContact({ id: 'c-a', name: 'Bruna', companyId: 'co-1' }), makeContact({ id: 'c-b', name: 'Caio' }));
  store.deals.push(
    makeDeal({ id: 'd1', stageId: 's-novo', position: 1, value: 1000, contactId: 'c-a', title: 'Lakehouse' }),
    makeDeal({ id: 'd2', stageId: 's-novo', position: 0, value: 500, contactId: 'c-b', title: 'BI', ownerId: GESTOR.id }),
    makeDeal({ id: 'd3', stageId: 's-neg', position: 0, value: 2000, contactId: 'c-b', title: 'Data mesh' }),
  );
  return createFakeRepos(store);
}

describe('getBoard', () => {
  it('uma coluna por etapa, na ordem do funil, com contagem e soma (US2-1)', async () => {
    const columns = await getBoard({ repos: setup() });
    expect(columns.map((column) => column.stage.id)).toEqual([
      's-novo', 's-qual', 's-diag', 's-real', 's-neg', 's-ganho', 's-perdido', 's-standby',
    ]);
    expect(columns[0]).toMatchObject({ count: 2, total: 1500 });
    expect(columns[0]?.deals.map((deal) => deal.id)).toEqual(['d2', 'd1']);
    expect(columns[4]).toMatchObject({ count: 1, total: 2000 });
  });

  it('filtra por dono (US2-5)', async () => {
    const columns = await getBoard({ repos: setup() }, { ownerId: GESTOR.id });
    expect(columns.flatMap((column) => column.deals.map((deal) => deal.id))).toEqual(['d2']);
  });

  it('busca por título, contato ou empresa, ignorando acentos (FR-012)', async () => {
    const repos = setup();
    const byCompany = await getBoard({ repos }, { q: 'acai' });
    expect(byCompany.flatMap((c) => c.deals.map((d) => d.id))).toEqual(['d1']);

    const byContact = await getBoard({ repos }, { q: 'caio' });
    expect(byContact.flatMap((c) => c.deals.map((d) => d.id)).sort()).toEqual(['d2', 'd3']);

    const byTitle = await getBoard({ repos }, { q: 'MESH' });
    expect(byTitle[4]).toMatchObject({ count: 1, total: 2000 });
  });
});
