import type { DbClient } from '../server';
import type { Json, Tables } from '../types';
import { check } from './errors';
import { mapActivity } from './mappers';
import type { ActivitiesRepo } from './types';

const SELECT = '*, author:profiles(id, name)';
type Row = Tables<'activities'> & { author: { id: string; name: string } | null };

export function createActivitiesRepo(db: DbClient): ActivitiesRepo {
  return {
    async insert(input) {
      const row = check(
        await db
          .from('activities')
          .insert({
            deal_id: input.dealId ?? null,
            contact_id: input.contactId ?? null,
            type: input.type,
            content: input.content ?? null,
            metadata: (input.metadata ?? {}) as Json,
            author_id: input.authorId,
          })
          .select(SELECT)
          .single(),
      );
      return mapActivity(row as unknown as Row);
    },

    async listByDeal(dealId) {
      const rows = check(
        await db.from('activities').select(SELECT).eq('deal_id', dealId).order('created_at', { ascending: false }),
      );
      return (rows as unknown as Row[]).map(mapActivity);
    },

    async listByContact(contactId) {
      // contact_id é preenchido também nas atividades dos deals do contato (FR-028).
      const rows = check(
        await db
          .from('activities')
          .select(SELECT)
          .eq('contact_id', contactId)
          .order('created_at', { ascending: false }),
      );
      return (rows as unknown as Row[]).map(mapActivity);
    },
  };
}
