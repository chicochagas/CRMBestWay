import type { DbClient } from '../server';
import { check, checkMaybe, toDomainError, checkOk } from './errors';
import { mapStage } from './mappers';
import type { StagesRepo } from './types';

export function createStagesRepo(db: DbClient): StagesRepo {
  return {
    async listOrdered() {
      const rows = check(await db.from('stages').select('*').order('position', { ascending: true }));
      return rows.map(mapStage);
    },

    async getById(id) {
      const row = checkMaybe(await db.from('stages').select('*').eq('id', id).maybeSingle());
      return row ? mapStage(row) : null;
    },

    async getByKey(key) {
      const row = checkMaybe(await db.from('stages').select('*').eq('key', key).maybeSingle());
      return row ? mapStage(row) : null;
    },

    async insert(input) {
      const row = check(
        await db
          .from('stages')
          .insert({
            name: input.name,
            position: input.position,
            probability: input.probability,
            color: input.color,
            kind: input.kind,
            key: input.key,
          })
          .select()
          .single(),
      );
      return mapStage(row);
    },

    async update(id, patch) {
      checkOk(await db.from('stages').update(patch).eq('id', id));
    },

    async updatePositions(orderedIds) {
      // Poucas etapas (≈10): updates individuais bastam.
      for (const [index, id] of orderedIds.entries()) {
        checkOk(await db.from('stages').update({ position: index + 1 }).eq('id', id));
      }
    },

    async delete(id) {
      checkOk(await db.from('stages').delete().eq('id', id));
    },

    async countDeals(stageId) {
      const { count, error } = await db
        .from('deals')
        .select('id', { count: 'exact', head: true })
        .eq('stage_id', stageId);
      if (error) throw toDomainError(error);
      return count ?? 0;
    },
  };
}
