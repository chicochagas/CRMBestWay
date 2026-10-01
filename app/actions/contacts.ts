'use server';

import { revalidatePath } from 'next/cache';
import { getServiceContext } from '@/lib/actions/context';
import { runAction, type ActionResult } from '@/lib/actions/result';
import { createContact as createContactService, deleteContact as deleteContactService, updateContact as updateContactService } from '@/lib/services/contacts/contacts';
import { createLead as createLeadService } from '@/lib/services/leads/createLead';
import { idSchema } from '@/lib/validation/common';
import { createContactSchema, updateContactSchema } from '@/lib/validation/contact';
import { createLeadSchema } from '@/lib/validation/deal';

function revalidateCrm() {
  revalidatePath('/', 'layout');
}

export async function createContact(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const data = createContactSchema.parse(input);
    const result = await createContactService(await getServiceContext(), data);
    revalidateCrm();
    return result;
  });
}

export async function updateContact(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const data = updateContactSchema.parse(input);
    const result = await updateContactService(await getServiceContext(), data);
    revalidateCrm();
    return result;
  });
}

export async function deleteContact(id: unknown): Promise<ActionResult<void>> {
  return runAction(async () => {
    await deleteContactService(await getServiceContext(), { id: idSchema.parse(id) });
    revalidateCrm();
  });
}

/** Busca para os seletores do "Novo lead" (leitura; a RLS se aplica). */
export async function searchLeadOptions(q: unknown): Promise<{
  contacts: { id: string; name: string; email: string; companyName: string | null }[];
  companies: { id: string; name: string; domain: string | null }[];
}> {
  const term = typeof q === 'string' ? q.slice(0, 80) : '';
  if (term.trim().length < 2) return { contacts: [], companies: [] };
  const { repos } = await getServiceContext();
  const [contacts, companies] = await Promise.all([repos.contacts.search(term), repos.companies.search(term)]);
  return {
    contacts: contacts.slice(0, 8).map((c) => ({ id: c.id, name: c.name, email: c.email, companyName: c.company?.name ?? null })),
    companies: companies.slice(0, 8),
  };
}

export async function createLead(
  input: unknown,
): Promise<ActionResult<{ companyId: string | null; contactId: string; dealId: string }>> {
  return runAction(async () => {
    const data = createLeadSchema.parse(input);
    const result = await createLeadService(await getServiceContext(), data);
    revalidateCrm();
    return result;
  });
}
