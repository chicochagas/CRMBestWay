'use server';

import { revalidatePath } from 'next/cache';
import { getServiceContext } from '@/lib/actions/context';
import { runAction, type ActionResult } from '@/lib/actions/result';
import { addNote as addNoteService } from '@/lib/services/activities/activities';
import { addNoteSchema } from '@/lib/validation/note';

export async function addNote(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const data = addNoteSchema.parse(input);
    const result = await addNoteService(await getServiceContext(), data);
    revalidatePath('/', 'layout');
    return result;
  });
}
