import { todayInSaoPaulo } from '@/lib/dates';
import type { DealStatus } from '@/lib/domain';
import { notFound, type ServiceContext } from '../context';
import { validateTransition, type TransitionInput } from './transitions';

export type MoveDealArgs = {
  dealId: string;
  toStageId: string;
  toIndex: number;
  input?: TransitionInput;
  today?: string;
};

/**
 * Move o deal de etapa/posição. Valida pela fonte única (transitions.ts) e grava etapa, posição
 * e campos de fechamento numa única chamada atômica (move_deal), depois registra a timeline.
 */
export async function moveDeal({ repos, viewer }: ServiceContext, args: MoveDealArgs): Promise<{ status: DealStatus }> {
  const deal = await repos.deals.getById(args.dealId);
  if (!deal) throw notFound('Deal');

  const stages = await repos.stages.listOrdered();
  const fromStage = stages.find((stage) => stage.id === deal.stageId);
  const toStage = stages.find((stage) => stage.id === args.toStageId);
  if (!toStage) throw notFound('Etapa');

  const patch = validateTransition({
    deal,
    contactOrigem: deal.contact.origem,
    toStage,
    stages,
    today: args.today ?? todayInSaoPaulo(),
    input: args.input,
  });

  await repos.deals.move(deal.id, toStage.id, args.toIndex, patch);

  const base = { dealId: deal.id, contactId: deal.contactId, authorId: viewer.id };
  if (toStage.id !== deal.stageId) {
    await repos.activities.insert({
      ...base,
      type: 'stage_change',
      metadata: {
        from_stage_id: deal.stageId,
        to_stage_id: toStage.id,
        from_name: fromStage?.name ?? null,
        to_name: toStage.name,
      },
    });
  }
  if (patch.nextAction !== undefined) {
    await repos.activities.insert({
      ...base,
      type: 'next_action_change',
      metadata: {
        from: { action: deal.nextAction, date: deal.nextActionDate },
        to: { action: patch.nextAction, date: patch.nextActionDate ?? null },
      },
    });
  }

  return { status: patch.status ?? deal.status };
}
