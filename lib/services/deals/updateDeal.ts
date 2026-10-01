import { DomainError } from '../errors';
import { notFound, requireGestor, type ServiceContext } from '../context';

export type UpdateDealArgs = { id: string; title?: string; value?: number; ownerId?: string | null };

export async function updateDeal({ repos }: ServiceContext, args: UpdateDealArgs): Promise<{ id: string }> {
  const deal = await repos.deals.getById(args.id);
  if (!deal) throw notFound('Deal');

  if (args.ownerId && args.ownerId !== deal.ownerId) {
    const owner = await repos.profiles.getById(args.ownerId);
    if (!owner?.active) throw new DomainError('VALIDATION', 'Escolha um dono ativo.', { field: 'ownerId' });
  }

  await repos.deals.update(deal.id, {
    title: args.title?.trim(),
    value: args.value,
    ownerId: args.ownerId,
  });
  return { id: deal.id };
}

/** Exclusão de deal só por gestor (FR-008); a RLS reforça. */
export async function deleteDeal({ repos, viewer }: ServiceContext, { id }: { id: string }): Promise<{ contactId: string }> {
  requireGestor(viewer);
  const deal = await repos.deals.getById(id);
  if (!deal) throw notFound('Deal');
  await repos.deals.delete(id);
  return { contactId: deal.contactId };
}
