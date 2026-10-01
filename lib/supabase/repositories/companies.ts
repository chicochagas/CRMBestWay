import type { DbClient } from '../server';
import { check, checkMaybe, sanitizeSearch, checkOk } from './errors';
import { mapCompany } from './mappers';
import type { CompaniesRepo } from './types';

export function createCompaniesRepo(db: DbClient): CompaniesRepo {
  return {
    async insert(input) {
      const row = check(await db.from('companies').insert(input).select().single());
      return mapCompany(row);
    },

    async update(id, patch) {
      checkOk(await db.from('companies').update(patch).eq('id', id));
    },

    async getById(id) {
      const row = checkMaybe(await db.from('companies').select('*').eq('id', id).maybeSingle());
      return row ? mapCompany(row) : null;
    },

    async delete(id) {
      checkOk(await db.from('companies').delete().eq('id', id));
    },

    async search(q) {
      const term = sanitizeSearch(q);
      let query = db.from('companies').select('*').order('name').limit(50);
      if (term) query = query.or(`name.ilike.%${term}%,domain.ilike.%${term}%`);
      const rows = check(await query);
      return rows.map(mapCompany);
    },
  };
}
