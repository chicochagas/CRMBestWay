import type { ServiceContext } from '../context';
import { moveDeal } from './moveDeal';

export type ReopenDealArgs = {
  dealId: string;
  toStageId: string;
  toIndex: number;
  nextAction: string;
  nextActionDate: string;
  today?: string;
};

/** Volta um deal ganho/perdido/stand-by para o funil, exigindo nova próxima ação (US4-6). */
export function reopenDeal(ctx: ServiceContext, { nextAction, nextActionDate, ...target }: ReopenDealArgs) {
  return moveDeal(ctx, { ...target, input: { reopen: { nextAction, nextActionDate } } });
}
