import { DomainError } from '../errors';
import { notFound, type ServiceContext } from '../context';

export type SetNextActionArgs = {
  dealId: string;
  nextAction: string;
  nextActionDate: string;
  completedNote?: string;
};

/** Conclui a ação atual (nota opcional) e agenda a próxima (FR-023, FR-027). */
export async function setNextAction({ repos, viewer }: ServiceContext, args: SetNextActionArgs): Promise<{ id: string }> {
  const nextAction = args.nextAction?.trim();
  if (!nextAction || !args.nextActionDate) {
    throw new DomainError('NEXT_ACTION_REQUIRED', 'Defina a próxima ação e a data.', { field: 'nextAction' });
  }

  const deal = await repos.deals.getById(args.dealId);
  if (!deal) throw notFound('Deal');
  if (deal.status !== 'open') {
    throw new DomainError('CONFLICT', 'Este deal não está em aberto. Reabra-o para agendar uma ação.');
  }

  const base = { dealId: deal.id, contactId: deal.contactId, authorId: viewer.id };
  const completedNote = args.completedNote?.trim();
  if (completedNote) {
    await repos.activities.insert({ ...base, type: 'note', content: completedNote });
  }

  await repos.deals.update(deal.id, { nextAction, nextActionDate: args.nextActionDate });
  await repos.activities.insert({
    ...base,
    type: 'next_action_change',
    metadata: {
      from: { action: deal.nextAction, date: deal.nextActionDate },
      to: { action: nextAction, date: args.nextActionDate },
    },
  });

  return { id: deal.id };
}
