import type { Origem } from '@/lib/domain';
import { DomainError } from '../errors';
import { notFound, type ServiceContext } from '../context';

export type ContactArgs = {
  name: string;
  email: string;
  phone?: string | null;
  companyId?: string | null;
  origem?: Origem;
};

function emailTaken(existingId: string): DomainError {
  return new DomainError('CONTACT_EMAIL_TAKEN', 'Já existe um contato com este e-mail.', {
    field: 'email',
    meta: { existingId },
  });
}

/** Contato manual: e-mail único (minúsculas), origem padrão outbound (FR-006). */
export async function createContact({ repos }: Pick<ServiceContext, 'repos'>, args: ContactArgs): Promise<{ id: string }> {
  const email = args.email.trim().toLowerCase();
  const existing = await repos.contacts.findByEmail(email);
  if (existing) throw emailTaken(existing.id);

  const contact = await repos.contacts.insert({
    name: args.name.trim(),
    email,
    phone: args.phone ?? null,
    companyId: args.companyId ?? null,
    origem: args.origem ?? 'outbound',
  });
  return { id: contact.id };
}

export async function updateContact(
  { repos }: Pick<ServiceContext, 'repos'>,
  { id, ...args }: ContactArgs & { id: string },
): Promise<{ id: string }> {
  const contact = await repos.contacts.getById(id);
  if (!contact) throw notFound('Contato');

  const email = args.email.trim().toLowerCase();
  if (email !== contact.email) {
    const existing = await repos.contacts.findByEmail(email);
    if (existing && existing.id !== id) throw emailTaken(existing.id);
  }

  await repos.contacts.update(id, {
    name: args.name.trim(),
    email,
    phone: args.phone ?? null,
    companyId: args.companyId ?? null,
    origem: args.origem ?? contact.origem,
  });
  return { id };
}

/** Contato com deals não pode ser excluído (FR-008); a RLS reforça. */
export async function deleteContact({ repos }: Pick<ServiceContext, 'repos'>, { id }: { id: string }): Promise<void> {
  if ((await repos.contacts.countDeals(id)) > 0) {
    throw new DomainError('CONTACT_HAS_DEALS', 'Este contato tem deals. Exclua ou mova os deals antes.');
  }
  await repos.contacts.delete(id);
}
