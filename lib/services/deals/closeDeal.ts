import type { DealType, LostReason } from '@/lib/domain';
import type { ServiceContext } from '../context';
import { moveDeal } from './moveDeal';

export type CloseDealArgs = {
  dealId: string;
  toStageId: string;
  toIndex: number;
  won?: { dealType: DealType; mrr?: number };
  lost?: { reason: LostReason };
  standby?: { reaquecerEm: string };
  today?: string;
};

/** Ganho / Perdido / Stand-by: mesmo movimento atômico, com os dados de fechamento. */
export function closeDeal(ctx: ServiceContext, { won, lost, standby, ...target }: CloseDealArgs) {
  return moveDeal(ctx, { ...target, input: { won, lost, standby } });
}
