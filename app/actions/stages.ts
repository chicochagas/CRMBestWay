'use server';

import { revalidatePath } from 'next/cache';
import { getServiceContext } from '@/lib/actions/context';
import { runAction, type ActionResult } from '@/lib/actions/result';
import { createStage as createStageService, deleteStage as deleteStageService, reorderStages as reorderStagesService, updateStage as updateStageService } from '@/lib/services/stages/manageStages';
import { idSchema } from '@/lib/validation/common';
import { createStageSchema, reorderStagesSchema, updateStageSchema } from '@/lib/validation/stage';

function revalidateStages() {
  revalidatePath('/', 'layout');
}

export async function createStage(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const stage = await createStageService(await getServiceContext(), createStageSchema.parse(input));
    revalidateStages();
    return { id: stage.id };
  });
}

export async function updateStage(input: unknown): Promise<ActionResult<void>> {
  return runAction(async () => {
    await updateStageService(await getServiceContext(), updateStageSchema.parse(input));
    revalidateStages();
  });
}

export async function reorderStages(input: unknown): Promise<ActionResult<void>> {
  return runAction(async () => {
    await reorderStagesService(await getServiceContext(), reorderStagesSchema.parse(input));
    revalidateStages();
  });
}

export async function deleteStage(id: unknown): Promise<ActionResult<void>> {
  return runAction(async () => {
    await deleteStageService(await getServiceContext(), { id: idSchema.parse(id) });
    revalidateStages();
  });
}
