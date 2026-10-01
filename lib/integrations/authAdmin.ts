import 'server-only';
import type { Role } from '@/lib/domain';
import { createAdminClient } from '@/lib/supabase/admin';
import { DomainError } from '@/lib/services/errors';
import type { AuthAdmin } from '@/lib/services/members/manageMembers';

// Banimento "permanente" (100 anos) para membro desativado; 'none' remove o banimento.
const BANNED = '876000h';

/** Adapter do Supabase Auth admin (secret key). Único caminho para criar/banir membros. */
export function createAuthAdmin(): AuthAdmin {
  const admin = createAdminClient();

  return {
    async inviteUser(email, redirectTo) {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
      if (error) {
        if (error.status === 422 || /already/i.test(error.message)) {
          throw new DomainError('CONFLICT', 'Já existe um usuário com este e-mail.', { field: 'email' });
        }
        throw new DomainError('INTERNAL', 'Não foi possível enviar o convite.');
      }
      return { userId: data.user.id };
    },

    async deleteUser(userId) {
      await admin.auth.admin.deleteUser(userId);
    },

    async setBanned(userId, banned) {
      const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: banned ? BANNED : 'none' });
      if (error) throw new DomainError('INTERNAL', 'Não foi possível atualizar o acesso do membro.');
    },

    async insertProfile(profile: { id: string; name: string; role: Role }) {
      // `profiles` não tem policy de insert: só a secret key cria perfis.
      const { error } = await admin.from('profiles').insert(profile);
      if (error) throw new DomainError('INTERNAL', 'Não foi possível criar o perfil do membro.');
    },

    async listEmails() {
      const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
      if (error) return {};
      return Object.fromEntries(data.users.map((user) => [user.id, user.email ?? '']));
    },
  };
}
