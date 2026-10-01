import type {
  Activity,
  ActivityType,
  Company,
  Contact,
  Deal,
  DealStatus,
  DealType,
  LostReason,
  Origem,
  Profile,
  Role,
  Stage,
  StageKind,
} from '@/lib/domain';
import type { Json, Tables } from '../types';

export function mapProfile(row: Pick<Tables<'profiles'>, 'id' | 'name' | 'role' | 'active'>): Profile {
  return { id: row.id, name: row.name, role: row.role as Role, active: row.active };
}

export function mapStage(row: Tables<'stages'>): Stage {
  return {
    id: row.id,
    name: row.name,
    position: row.position,
    probability: row.probability,
    color: row.color,
    kind: row.kind as StageKind,
    key: row.key,
  };
}

export function mapCompany(row: Pick<Tables<'companies'>, 'id' | 'name' | 'domain'>): Company {
  return { id: row.id, name: row.name, domain: row.domain };
}

export function mapContact(row: Tables<'contacts'>): Contact {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    origem: row.origem as Origem,
  };
}

export function mapDeal(row: Tables<'deals'>): Deal {
  return {
    id: row.id,
    contactId: row.contact_id,
    stageId: row.stage_id,
    ownerId: row.owner_id,
    title: row.title,
    value: Number(row.value ?? 0),
    dealType: row.deal_type as DealType,
    mrr: Number(row.mrr ?? 0),
    position: row.position,
    status: row.status as DealStatus,
    nextAction: row.next_action,
    nextActionDate: row.next_action_date,
    lostReason: row.lost_reason as LostReason | null,
    reaquecerEm: row.reaquecer_em,
    qualifiedAt: row.qualified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function asRecord(value: Json | null): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function mapActivity(
  row: Tables<'activities'> & { author: { id: string; name: string } | null },
): Activity {
  return {
    id: row.id,
    dealId: row.deal_id,
    contactId: row.contact_id,
    type: row.type as ActivityType,
    content: row.content,
    metadata: asRecord(row.metadata),
    author: row.author ? { id: row.author.id, name: row.author.name } : null,
    createdAt: row.created_at,
  };
}
