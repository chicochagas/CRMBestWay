import { log } from '@/lib/log';
import type { ServiceContext } from '../context';
import { createCompany, type CompanyArgs } from '../companies/companies';
import { createContact, type ContactArgs } from '../contacts/contacts';
import { createDeal, type CreateDealArgs } from '../deals/createDeal';

export type CreateLeadArgs = {
  company?: { id: string } | CompanyArgs | null;
  contact: { id: string } | Omit<ContactArgs, 'companyId'>;
  deal: Omit<CreateDealArgs, 'contactId'>;
};

const isExisting = (value: object): value is { id: string } => 'id' in value;

/**
 * "Novo lead" (US3, SC-005): empresa → contato → deal num passo só. Sem transação entre
 * chamadas REST, então em falha desfaz somente o que esta chamada criou.
 */
export async function createLead(
  ctx: ServiceContext,
  args: CreateLeadArgs,
): Promise<{ companyId: string | null; contactId: string; dealId: string }> {
  const { repos } = ctx;
  const created: { companyId?: string; contactId?: string } = {};

  try {
    let companyId: string | null = null;
    if (args.company) {
      if (isExisting(args.company)) {
        companyId = args.company.id;
      } else {
        companyId = (await createCompany(ctx, args.company)).id;
        created.companyId = companyId;
      }
    }

    let contactId: string;
    if (isExisting(args.contact)) {
      contactId = args.contact.id;
    } else {
      contactId = (await createContact(ctx, { ...args.contact, companyId })).id;
      created.contactId = contactId;
    }

    const { id: dealId } = await createDeal(ctx, { ...args.deal, contactId });
    return { companyId, contactId, dealId };
  } catch (error) {
    if (created.contactId) await repos.contacts.delete(created.contactId).catch(() => undefined);
    if (created.companyId) await repos.companies.delete(created.companyId).catch(() => undefined);
    if (created.contactId || created.companyId) log.warn('lead_rolled_back', { contactId: created.contactId });
    throw error;
  }
}
