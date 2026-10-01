import { describe, expect, it } from 'vitest';
import { createStage, deleteStage, reorderStages, updateStage } from '@/lib/services/stages/manageStages';
import { createFakeRepos, createStore, GESTOR, makeDeal, VENDEDOR } from '../fakes/repositories';
import { expectCode } from '../helpers';

function setup() {
  const store = createStore();
  return { store, gestor: { repos: createFakeRepos(store), viewer: GESTOR }, vendedor: { repos: createFakeRepos(store), viewer: VENDEDOR } };
}

describe('manageStages', () => {
  it('só gestor altera etapas (US7-3)', async () => {
    const { vendedor } = setup();
    await expectCode(updateStage(vendedor, { id: 's-neg', name: 'X' }), 'FORBIDDEN');
  });

  it('probabilidade fora de 0–100 é rejeitada', async () => {
    const { gestor } = setup();
    await expectCode(updateStage(gestor, { id: 's-neg', probability: 120 }), 'VALIDATION');
  });

  it('cria etapa depois da escolhida e desloca as seguintes (US7-1)', async () => {
    const { gestor, store } = setup();
    const created = await createStage(gestor, { name: 'Piloto', probability: 50, color: '#123456', afterStageId: 's-neg' });
    const ordered = [...store.stages].sort((a, b) => a.position - b.position).map((stage) => stage.id);
    expect(ordered.indexOf(created.id)).toBe(ordered.indexOf('s-neg') + 1);
    expect(ordered.at(-1)).toBe('s-standby');
    expect(created).toMatchObject({ kind: 'open', key: null });
  });

  it('não exclui etapa de desfecho, de sistema ou com deals (US7-2)', async () => {
    const { gestor, store } = setup();
    await expectCode(deleteStage(gestor, { id: 's-ganho' }), 'STAGE_NOT_DELETABLE');
    await expectCode(deleteStage(gestor, { id: 's-qual' }), 'STAGE_NOT_DELETABLE');
    store.deals.push(makeDeal({ stageId: 's-real' }));
    await expectCode(deleteStage(gestor, { id: 's-real' }), 'STAGE_NOT_DELETABLE');
  });

  it('exclui etapa aberta vazia', async () => {
    const { gestor, store } = setup();
    await deleteStage(gestor, { id: 's-real' });
    expect(store.stages.map((stage) => stage.id)).not.toContain('s-real');
  });

  it('mantém os desfechos depois das etapas abertas ao reordenar', async () => {
    const { gestor, store } = setup();
    const ids = [...store.stages].sort((a, b) => a.position - b.position).map((stage) => stage.id);
    const broken = ['s-ganho', ...ids.filter((id) => id !== 's-ganho')];
    await expectCode(reorderStages(gestor, { orderedIds: broken }), 'VALIDATION');

    const swapped = ['s-qual', 's-novo', ...ids.slice(2)];
    await reorderStages(gestor, { orderedIds: swapped });
    expect(store.stages.find((stage) => stage.id === 's-qual')?.position).toBe(1);
  });
});
