import { describe, expect, it, vi } from 'vitest';
import type { AuthAdmin } from '@/lib/services/members/manageMembers';
import { inviteMember, setMemberActive, updateMemberRole } from '@/lib/services/members/manageMembers';
import { DomainError } from '@/lib/services/errors';
import { createFakeRepos, createStore, GESTOR, VENDEDOR } from '../fakes/repositories';
import { expectCode } from '../helpers';

function fakeAuthAdmin(overrides: Partial<AuthAdmin> = {}): AuthAdmin {
  return {
    inviteUser: vi.fn(async () => ({ userId: 'u-novo' })),
    deleteUser: vi.fn(async () => undefined),
    setBanned: vi.fn(async () => undefined),
    insertProfile: vi.fn(async () => undefined),
    listEmails: vi.fn(async () => ({})),
    ...overrides,
  };
}

function setup(viewer = GESTOR, authAdmin = fakeAuthAdmin()) {
  const store = createStore();
  return { store, authAdmin, ctx: { repos: createFakeRepos(store), viewer, authAdmin } };
}

const invite = { name: 'Nova Pessoa', email: 'Nova@RedRex.com', role: 'vendedor' as const, redirectTo: 'http://x/auth/confirm' };

describe('inviteMember', () => {
  it('não-gestor → FORBIDDEN', async () => {
    const { ctx } = setup(VENDEDOR);
    await expectCode(inviteMember(ctx, invite), 'FORBIDDEN');
  });

  it('convida com e-mail normalizado e cria o perfil', async () => {
    const { ctx, authAdmin } = setup();
    await inviteMember(ctx, invite);
    expect(authAdmin.inviteUser).toHaveBeenCalledWith('nova@redrex.com', invite.redirectTo);
    expect(authAdmin.insertProfile).toHaveBeenCalledWith({ id: 'u-novo', name: 'Nova Pessoa', role: 'vendedor' });
  });

  it('se o perfil falhar, apaga o usuário criado', async () => {
    const authAdmin = fakeAuthAdmin({
      insertProfile: vi.fn(async () => {
        throw new DomainError('INTERNAL', 'falhou');
      }),
    });
    const { ctx } = setup(GESTOR, authAdmin);
    await expectCode(inviteMember(ctx, invite), 'INTERNAL');
    expect(authAdmin.deleteUser).toHaveBeenCalledWith('u-novo');
  });

  it('e-mail existente → CONFLICT', async () => {
    const authAdmin = fakeAuthAdmin({
      inviteUser: vi.fn(async () => {
        throw new DomainError('CONFLICT', 'existe');
      }),
    });
    const { ctx } = setup(GESTOR, authAdmin);
    await expectCode(inviteMember(ctx, invite), 'CONFLICT');
  });
});

describe('updateMemberRole / setMemberActive', () => {
  it('não remove o último gestor ativo', async () => {
    const { ctx } = setup();
    await expectCode(updateMemberRole(ctx, { id: GESTOR.id, role: 'vendedor' }), 'CONFLICT');
  });

  it('não desativa a si mesmo', async () => {
    const { ctx } = setup();
    await expectCode(setMemberActive(ctx, { id: GESTOR.id, active: false }), 'CONFLICT');
  });

  it('desativar bane no Auth e marca inativo', async () => {
    const { ctx, store, authAdmin } = setup();
    await setMemberActive(ctx, { id: VENDEDOR.id, active: false });
    expect(authAdmin.setBanned).toHaveBeenCalledWith(VENDEDOR.id, true);
    expect(store.profiles.find((p) => p.id === VENDEDOR.id)?.active).toBe(false);
  });
});
