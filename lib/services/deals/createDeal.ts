import { STAGE_KEYS } from '@/lib/domain';
import { DomainError } from '../errors';
import { notFound, type ServiceContext } from '../context';

export type CreateDealArgs = {
  contactId: string;
  title: string;
  value?: number;
  ownerId?: string | null;
  nextAction: string;
  nextActionDate: string;
};

/** Deal manual: nasce em "Novo lead", no fim da coluna, com dono e próxima ação (FR-007, FR-015). */
export async function createDeal({ repos, viewer }: ServiceContext, args: CreateDealArgs): Promise<{ id: string }> {
  const nextAction = args.nextAction?.trim();
  if (!nextAction || !args.nextActionDate) {
    throw new DomainError('NEXT_ACTION_REQUIRED', 'Todo deal precisa de próxima ação e data.', { field: 'nextAction' });
  }

  const contact = await repos.contacts.getById(args.contactId);
  if (!contact) throw notFound('Contato');

  const stage = await repos.stages.getByKey(STAGE_KEYS.novoLead);
  if (!stage) throw notFound('Etapa "Novo lead"');

  const ownerId = args.ownerId ?? viewer.id;
  if (ownerId !== viewer.id) {
    const owner = await repos.profiles.getById(ownerId);
    if (!owner?.active) throw new DomainError('VALIDATION', 'Escolha um dono ativo.', { field: 'ownerId' });
  }

  const deal = await repos.deals.insert({
    contactId: contact.id,
    stageId: stage.id,
    ownerId,
    title: args.title.trim(),
    value: args.value ?? 0,
    nextAction,
    nextActionDate: args.nextActionDate,
  });
  return { id: deal.id };
}
