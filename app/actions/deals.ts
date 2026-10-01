'use server';

import { revalidatePath } from 'next/cache';
import { getServiceContext } from '@/lib/actions/context';
import { runAction, type ActionResult } from '@/lib/actions/result';
import type { DealStatus } from '@/lib/domain';
import { closeDeal as closeDealService } from '@/lib/services/deals/closeDeal';
import { createDeal as createDealService } from '@/lib/services/deals/createDeal';
import { moveDeal as moveDealService } from '@/lib/services/deals/moveDeal';
import { reopenDeal as reopenDealService } from '@/lib/services/deals/reopenDeal';
import { setNextAction as setNextActionService } from '@/lib/services/deals/setNextAction';
import { deleteDeal as deleteDealService, updateDeal as updateDealService } from '@/lib/services/deals/updateDeal';
import { idSchema } from '@/lib/validation/common';
import {
  closeDealSchema,
  createDealSchema,
  moveDealSchema,
  reopenDealSchema,
  updateDealSchema,
} from '@/lib/validation/deal';
import { setNextActionSchema } from '@/lib/validation/nextAction';

// Hoje, pipeline, deal, contato e o contador da sidebar dependem dos deals.
function revalidateCrm() {
  revalidatePath('/', 'layout');
}

export async function setNextAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const data = setNextActionSchema.parse(input);
    const result = await setNextActionService(await getServiceContext(), data);
    revalidateCrm();
    return result;
  });
}

export async function moveDeal(input: unknown): Promise<ActionResult<{ status: DealStatus }>> {
  return runAction(async () => {
    const data = moveDealSchema.parse(input);
    const result = await moveDealService(await getServiceContext(), data);
    revalidateCrm();
    return result;
  });
}

export async function closeDeal(input: unknown): Promise<ActionResult<{ status: DealStatus }>> {
  return runAction(async () => {
    const data = closeDealSchema.parse(input);
    const result = await closeDealService(await getServiceContext(), data);
    revalidateCrm();
    return result;
  });
}

export async function reopenDeal(input: unknown): Promise<ActionResult<{ status: DealStatus }>> {
  return runAction(async () => {
    const data = reopenDealSchema.parse(input);
    const result = await reopenDealService(await getServiceContext(), data);
    revalidateCrm();
    return result;
  });
}

export async function createDeal(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const data = createDealSchema.parse(input);
    const result = await createDealService(await getServiceContext(), data);
    revalidateCrm();
    return result;
  });
}

export async function updateDeal(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const data = updateDealSchema.parse(input);
    const result = await updateDealService(await getServiceContext(), data);
    revalidateCrm();
    return result;
  });
}

export async function deleteDeal(id: unknown): Promise<ActionResult<{ contactId: string }>> {
  return runAction(async () => {
    const result = await deleteDealService(await getServiceContext(), { id: idSchema.parse(id) });
    revalidateCrm();
    return result;
  });
}
