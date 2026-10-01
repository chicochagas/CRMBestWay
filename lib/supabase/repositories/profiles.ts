import type { Role } from '@/lib/domain';
import type { DbClient } from '../server';
import { check, checkMaybe, toDomainError, checkOk } from './errors';
import { mapProfile } from './mappers';
import type { ProfilesRepo } from './types';

const COLUMNS = 'id, name, role, active';

export function createProfilesRepo(db: DbClient): ProfilesRepo {
  return {
    async getById(id) {
      const row = checkMaybe(await db.from('profiles').select(COLUMNS).eq('id', id).maybeSingle());
      return row ? mapProfile(row) : null;
    },

    async listActive() {
      const rows = check(await db.from('profiles').select(COLUMNS).eq('active', true).order('name'));
      return rows.map(mapProfile);
    },

    async listAll() {
      const rows = check(await db.from('profiles').select(COLUMNS).order('name'));
      return rows.map(mapProfile);
    },

    async updateRole(id, role: Role) {
      checkOk(await db.from('profiles').update({ role }).eq('id', id));
    },

    async setActive(id, active) {
      checkOk(await db.from('profiles').update({ active }).eq('id', id));
    },

    async countActiveGestores() {
      const { count, error } = await db
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'gestor')
        .eq('active', true);
      if (error) throw toDomainError(error);
      return count ?? 0;
    },
  };
}
