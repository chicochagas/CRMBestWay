'use server';

import { revalidatePath } from 'next/cache';
import { getServiceContext } from '@/lib/actions/context';
import { runAction, type ActionResult } from '@/lib/actions/result';
import { getServerEnv } from '@/lib/env.server';
import { createAuthAdmin } from '@/lib/integrations/authAdmin';
import { requireGestor } from '@/lib/services/context';
import { inviteMember as inviteMemberService, setMemberActive as setMemberActiveService, updateMemberRole as updateMemberRoleService } from '@/lib/services/members/manageMembers';
import { inviteMemberSchema, setMemberActiveSchema, updateMemberRoleSchema } from '@/lib/validation/member';

// requireGestor roda antes de criar o client admin: vendedor nunca chega à secret key.
async function membersContext() {
  const ctx = await getServiceContext();
  requireGestor(ctx.viewer);
  return { ...ctx, authAdmin: createAuthAdmin() };
}

export async function inviteMember(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const data = inviteMemberSchema.parse(input);
    const result = await inviteMemberService(await membersContext(), {
      ...data,
      redirectTo: `${getServerEnv().siteUrl}/auth/confirm`,
    });
    revalidatePath('/', 'layout');
    return result;
  });
}

export async function updateMemberRole(input: unknown): Promise<ActionResult<void>> {
  return runAction(async () => {
    await updateMemberRoleService(await membersContext(), updateMemberRoleSchema.parse(input));
    revalidatePath('/', 'layout');
  });
}

export async function setMemberActive(input: unknown): Promise<ActionResult<void>> {
  return runAction(async () => {
    await setMemberActiveService(await membersContext(), setMemberActiveSchema.parse(input));
    revalidatePath('/', 'layout');
  });
}
