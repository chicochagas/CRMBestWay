'use server';

import { revalidatePath } from 'next/cache';
import { getServiceContext } from '@/lib/actions/context';
import { runAction, type ActionResult } from '@/lib/actions/result';
import { createCompany as createCompanyService, updateCompany as updateCompanyService } from '@/lib/services/companies/companies';
import { createCompanySchema, updateCompanySchema } from '@/lib/validation/company';

export async function createCompany(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const data = createCompanySchema.parse(input);
    const result = await createCompanyService(await getServiceContext(), data);
    revalidatePath('/', 'layout');
    return result;
  });
}

export async function updateCompany(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const data = updateCompanySchema.parse(input);
    const result = await updateCompanyService(await getServiceContext(), data);
    revalidatePath('/', 'layout');
    return result;
  });
}
