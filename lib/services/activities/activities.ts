import type { Activity } from '@/lib/domain';
import { DomainError } from '../errors';
import { notFound, type ServiceContext } from '../context';

export type AddNoteArgs = {
  type: 'note' | 'call_note';
  content: string;
  dealId?: string;
  contactId?: string;
};

/** Nota ou nota de call no deal e/ou contato (FR-029). Com deal, herda o contato do deal. */
export async function addNote({ repos, viewer }: ServiceContext, args: AddNoteArgs): Promise<{ id: string }> {
  const content = args.content?.trim();
  if (!content || content.length > 5000) {
    throw new DomainError('VALIDATION', 'A nota precisa ter de 1 a 5000 caracteres.', { field: 'content' });
  }

  let contactId = args.contactId ?? null;
  if (args.dealId) {
    const deal = await repos.deals.getById(args.dealId);
    if (!deal) throw notFound('Deal');
    contactId = deal.contactId;
  }
  if (!args.dealId && !contactId) {
    throw new DomainError('VALIDATION', 'Informe o deal ou o contato.', { field: 'dealId' });
  }

  const activity = await repos.activities.insert({
    dealId: args.dealId ?? null,
    contactId,
    type: args.type,
    content,
    authorId: viewer.id,
  });
  return { id: activity.id };
}

/** Timeline do deal, ou do contato combinando as atividades dos seus deals (FR-028). */
export async function getTimeline(
  { repos }: Pick<ServiceContext, 'repos'>,
  target: { dealId: string } | { contactId: string },
): Promise<Activity[]> {
  const items =
    'dealId' in target
      ? await repos.activities.listByDeal(target.dealId)
      : await repos.activities.listByContact(target.contactId);
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
