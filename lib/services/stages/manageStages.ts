import type { Stage } from '@/lib/domain';
import { DomainError } from '../errors';
import { notFound, requireGestor, type ServiceContext } from '../context';

function assertProbability(probability: number | undefined): void {
  if (probability === undefined) return;
  if (!Number.isInteger(probability) || probability < 0 || probability > 100) {
    throw new DomainError('VALIDATION', 'A probabilidade vai de 0 a 100.', { field: 'probability' });
  }
}

/** Nova etapa (sempre aberta, sem chave de sistema) logo depois de `afterStageId` (FR-014). */
export async function createStage(
  { repos, viewer }: ServiceContext,
  args: { name: string; probability: number; color: string; afterStageId: string },
): Promise<Stage> {
  requireGestor(viewer);
  assertProbability(args.probability);

  const stages = await repos.stages.listOrdered();
  const index = stages.findIndex((stage) => stage.id === args.afterStageId);
  if (index < 0) throw notFound('Etapa');
  if (stages[index]?.kind !== 'open') {
    throw new DomainError('VALIDATION', 'Adicione a nova etapa depois de uma etapa em aberto.', {
      field: 'afterStageId',
    });
  }

  const created = await repos.stages.insert({
    name: args.name.trim(),
    probability: args.probability,
    color: args.color,
    position: stages.length + 1,
    kind: 'open',
    key: null,
  });

  const ordered = stages.map((stage) => stage.id);
  ordered.splice(index + 1, 0, created.id);
  await repos.stages.updatePositions(ordered);
  return created;
}

export async function updateStage(
  { repos, viewer }: ServiceContext,
  { id, ...patch }: { id: string; name?: string; probability?: number; color?: string },
): Promise<void> {
  requireGestor(viewer);
  assertProbability(patch.probability);
  if (!(await repos.stages.getById(id))) throw notFound('Etapa');
  await repos.stages.update(id, { ...patch, name: patch.name?.trim() });
}

/** Reordena; as etapas de desfecho (Ganho/Perdido/Stand-by) ficam sempre depois das abertas. */
export async function reorderStages({ repos, viewer }: ServiceContext, { orderedIds }: { orderedIds: string[] }) {
  requireGestor(viewer);
  const stages = await repos.stages.listOrdered();
  const byId = new Map(stages.map((stage) => [stage.id, stage]));

  const sameSet = orderedIds.length === stages.length && orderedIds.every((id) => byId.has(id));
  if (!sameSet) throw new DomainError('VALIDATION', 'A nova ordem precisa conter todas as etapas.');

  const firstClosed = orderedIds.findIndex((id) => byId.get(id)?.kind !== 'open');
  const openAfterClosed = firstClosed >= 0 && orderedIds.slice(firstClosed).some((id) => byId.get(id)?.kind === 'open');
  if (openAfterClosed) {
    throw new DomainError('VALIDATION', 'Ganho, Perdido e Stand-by precisam ficar depois das etapas em aberto.');
  }
  await repos.stages.updatePositions(orderedIds);
}

/** Etapas de sistema/desfecho ou com deals não podem ser excluídas (FR-014). */
export async function deleteStage({ repos, viewer }: ServiceContext, { id }: { id: string }): Promise<void> {
  requireGestor(viewer);
  const stage = await repos.stages.getById(id);
  if (!stage) throw notFound('Etapa');

  if (stage.kind !== 'open' || stage.key) {
    throw new DomainError('STAGE_NOT_DELETABLE', 'Esta etapa faz parte das regras do funil e não pode ser excluída.');
  }
  if ((await repos.stages.countDeals(id)) > 0) {
    throw new DomainError('STAGE_NOT_DELETABLE', 'Mova os deals desta etapa antes de excluí-la.');
  }

  await repos.stages.delete(id);
  const remaining = (await repos.stages.listOrdered()).map((item) => item.id);
  await repos.stages.updatePositions(remaining);
}
