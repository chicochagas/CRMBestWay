import type { DealCard, DealPatch, Origem } from '@/lib/domain';
import type { DbClient } from '../server';
import type { Json, Tables } from '../types';
import { check, checkMaybe, checkOk } from './errors';
import { mapDeal, mapStage } from './mappers';
import type { DealUpdate, DealsRepo, NewDeal, OwnerFilter } from './types';

const CARD_SELECT = `*,
  contact:contacts!inner(id, name, email, phone, origem, company:companies(id, name)),
  owner:profiles(id, name, active),
  stage:stages!inner(*)`;

type CardRow = Tables<'deals'> & {
  contact: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    origem: string;
    company: { id: string; name: string } | null;
  };
  owner: { id: string; name: string; active: boolean } | null;
  stage: Tables<'stages'>;
};

function mapCard(row: CardRow): DealCard {
  return {
    ...mapDeal(row),
    contact: {
      id: row.contact.id,
      name: row.contact.name,
      email: row.contact.email,
      phone: row.contact.phone,
      origem: row.contact.origem as Origem,
    },
    company: row.contact.company,
    owner: row.owner,
    stage: mapStage(row.stage),
  };
}

function toSnakePatch(patch: DealPatch): Record<string, Json> {
  const out: Record<string, Json> = {};
  if (patch.status !== undefined) out.status = patch.status;
  if (patch.dealType !== undefined) out.deal_type = patch.dealType;
  if (patch.mrr !== undefined) out.mrr = patch.mrr;
  if (patch.lostReason !== undefined) out.lost_reason = patch.lostReason;
  if (patch.reaquecerEm !== undefined) out.reaquecer_em = patch.reaquecerEm;
  if (patch.nextAction !== undefined) out.next_action = patch.nextAction;
  if (patch.nextActionDate !== undefined) out.next_action_date = patch.nextActionDate;
  if (patch.qualifiedAt !== undefined) out.qualified_at = patch.qualifiedAt;
  return out;
}

export function createDealsRepo(db: DbClient): DealsRepo {
  return {
    async getById(id) {
      const row = checkMaybe(await db.from('deals').select(CARD_SELECT).eq('id', id).maybeSingle());
      return row ? mapCard(row as unknown as CardRow) : null;
    },

    async insert(input: NewDeal) {
      const last = checkMaybe(
        await db
          .from('deals')
          .select('position')
          .eq('stage_id', input.stageId)
          .order('position', { ascending: false })
          .limit(1)
          .maybeSingle(),
      );
      const row = check(
        await db
          .from('deals')
          .insert({
            contact_id: input.contactId,
            stage_id: input.stageId,
            owner_id: input.ownerId,
            title: input.title,
            value: input.value,
            next_action: input.nextAction,
            next_action_date: input.nextActionDate,
            position: last ? last.position + 1 : 0,
            status: 'open',
          })
          .select()
          .single(),
      );
      return mapDeal(row);
    },

    async update(id, patch: DealUpdate) {
      const values: Partial<Tables<'deals'>> = {};
      if (patch.title !== undefined) values.title = patch.title;
      if (patch.value !== undefined) values.value = patch.value;
      if (patch.ownerId !== undefined) values.owner_id = patch.ownerId;
      if (patch.nextAction !== undefined) values.next_action = patch.nextAction;
      if (patch.nextActionDate !== undefined) values.next_action_date = patch.nextActionDate;
      checkOk(await db.from('deals').update(values).eq('id', id));
    },

    async move(dealId, stageId, index, patch = {}) {
      checkOk(
        await db.rpc('move_deal', {
          p_deal_id: dealId,
          p_stage_id: stageId,
          p_index: index,
          p_patch: toSnakePatch(patch),
        }),
      );
    },

    async delete(id) {
      checkOk(await db.from('deals').delete().eq('id', id));
    },

    async listToday(filter: OwnerFilter, today) {
      let query = db
        .from('deals')
        .select(CARD_SELECT)
        .eq('status', 'open')
        .lte('next_action_date', today)
        .order('next_action_date', { ascending: true })
        .order('updated_at', { ascending: true });
      if (filter.kind !== 'team') query = query.eq('owner_id', filter.ownerId);
      const rows = check(await query);
      return (rows as unknown as CardRow[]).map(mapCard);
    },

    async countToday(ownerId, today) {
      const { count, error } = await db
        .from('deals')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open')
        .eq('owner_id', ownerId)
        .lte('next_action_date', today);
      if (error) return 0;
      return count ?? 0;
    },

    async listBoard({ ownerId }) {
      let query = db.from('deals').select(CARD_SELECT).order('position', { ascending: true });
      if (ownerId) query = query.eq('owner_id', ownerId);
      const rows = check(await query);
      return (rows as unknown as CardRow[]).map(mapCard);
    },

    async listByContact(contactId) {
      const rows = check(
        await db.from('deals').select(CARD_SELECT).eq('contact_id', contactId).order('created_at', { ascending: false }),
      );
      return (rows as unknown as CardRow[]).map(mapCard);
    },
  };
}
