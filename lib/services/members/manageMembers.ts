import type { Role } from '@/lib/domain';
import { DomainError } from '../errors';
import { notFound, requireGestor, type ServiceContext } from '../context';

/** Operações do Auth admin (implementação em lib/integrations/authAdmin.ts). */
export interface AuthAdmin {
  inviteUser(email: string, redirectTo: string): Promise<{ userId: string }>;
  deleteUser(userId: string): Promise<void>;
  setBanned(userId: string, banned: boolean): Promise<void>;
  insertProfile(profile: { id: string; name: string; role: Role }): Promise<void>;
  listEmails(): Promise<Record<string, string>>;
}

type MembersContext = ServiceContext & { authAdmin: AuthAdmin };

/** Convite (US6-4): cria o usuário no Auth e o perfil; se o perfil falhar, desfaz o usuário. */
export async function inviteMember(
  { viewer, authAdmin }: MembersContext,
  args: { name: string; email: string; role: Role; redirectTo: string },
): Promise<{ id: string }> {
  requireGestor(viewer);
  const { userId } = await authAdmin.inviteUser(args.email.trim().toLowerCase(), args.redirectTo);
  try {
    await authAdmin.insertProfile({ id: userId, name: args.name.trim(), role: args.role });
  } catch (error) {
    await authAdmin.deleteUser(userId).catch(() => undefined);
    throw error;
  }
  return { id: userId };
}

async function assertNotLastGestor(ctx: MembersContext, memberId: string): Promise<void> {
  const member = await ctx.repos.profiles.getById(memberId);
  if (!member) throw notFound('Membro');
  if (member.role === 'gestor' && member.active && (await ctx.repos.profiles.countActiveGestores()) <= 1) {
    throw new DomainError('CONFLICT', 'O time precisa de pelo menos um gestor ativo.');
  }
}

export async function updateMemberRole(ctx: MembersContext, { id, role }: { id: string; role: Role }): Promise<void> {
  requireGestor(ctx.viewer);
  if (role !== 'gestor') await assertNotLastGestor(ctx, id);
  await ctx.repos.profiles.updateRole(id, role);
}

/** Desativar = banir no Auth (corta o login) + `active=false` (preserva dono/autoria). */
export async function setMemberActive(ctx: MembersContext, { id, active }: { id: string; active: boolean }): Promise<void> {
  requireGestor(ctx.viewer);
  if (!active) {
    if (id === ctx.viewer.id) throw new DomainError('CONFLICT', 'Você não pode desativar a si mesmo.');
    await assertNotLastGestor(ctx, id);
  }
  await ctx.authAdmin.setBanned(id, !active);
  await ctx.repos.profiles.setActive(id, active);
}
