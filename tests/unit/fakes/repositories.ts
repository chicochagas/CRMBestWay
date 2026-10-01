// Repositórios em memória para testar os serviços sem banco.
import type { Activity, Company, Contact, Deal, DealCard, Profile, Stage, Viewer } from '@/lib/domain';
import { DomainError } from '@/lib/services/errors';
import type { Repos } from '@/lib/supabase/repositories/types';

let seq = 0;
export const newId = (prefix = 'id') => `${prefix}-${++seq}`;

export const STAGES: Stage[] = [
  { id: 's-novo', name: 'Novo lead', position: 1, probability: 5, color: null, kind: 'open', key: 'novo_lead' },
  { id: 's-qual', name: 'Qualificado', position: 2, probability: 15, color: null, kind: 'open', key: 'qualificado' },
  { id: 's-diag', name: 'Diagnóstico agendado', position: 3, probability: 25, color: null, kind: 'open', key: 'diagnostico_agendado' },
  { id: 's-real', name: 'Diagnóstico realizado', position: 4, probability: 40, color: null, kind: 'open', key: null },
  { id: 's-neg', name: 'Negociação', position: 5, probability: 80, color: null, kind: 'open', key: null },
  { id: 's-ganho', name: 'Ganho', position: 6, probability: 100, color: null, kind: 'won', key: 'ganho' },
  { id: 's-perdido', name: 'Perdido', position: 7, probability: 0, color: null, kind: 'lost', key: 'perdido' },
  { id: 's-standby', name: 'Stand-by', position: 8, probability: 10, color: null, kind: 'standby', key: 'standby' },
];

export const GESTOR: Viewer = { id: 'u-gestor', name: 'Gestora', role: 'gestor', active: true, email: null };
export const VENDEDOR: Viewer = { id: 'u-vend', name: 'Vendedor', role: 'vendedor', active: true, email: null };

export type Store = {
  profiles: Profile[];
  stages: Stage[];
  deals: Deal[];
  contacts: Contact[];
  companies: Company[];
  activities: Activity[];
  moves: { dealId: string; stageId: string; index: number; patch: object }[];
};

export function createStore(partial: Partial<Store> = {}): Store {
  return {
    profiles: [GESTOR, VENDEDOR].map(({ id, name, role, active }) => ({ id, name, role, active })),
    stages: STAGES.map((stage) => ({ ...stage })),
    deals: [],
    contacts: [],
    companies: [],
    activities: [],
    moves: [],
    ...partial,
  };
}

export function makeContact(overrides: Partial<Contact> = {}): Contact {
  return { id: newId('c'), companyId: null, name: 'Ana', email: `ana${seq}@x.com`, phone: null, origem: 'outbound', ...overrides };
}

export function makeDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: newId('d'),
    contactId: 'c-1',
    stageId: 's-novo',
    ownerId: VENDEDOR.id,
    title: 'Deal',
    value: 1000,
    dealType: 'pontual',
    mrr: 0,
    position: 0,
    status: 'open',
    nextAction: 'Ligar',
    nextActionDate: '2026-10-01',
    lostReason: null,
    reaquecerEm: null,
    qualifiedAt: null,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    ...overrides,
  };
}

function toCard(store: Store, deal: Deal): DealCard {
  const contact = store.contacts.find((item) => item.id === deal.contactId) ?? makeContact({ id: deal.contactId });
  const company = store.companies.find((item) => item.id === contact.companyId) ?? null;
  const owner = store.profiles.find((item) => item.id === deal.ownerId) ?? null;
  const stage = store.stages.find((item) => item.id === deal.stageId)!;
  return {
    ...deal,
    contact: { id: contact.id, name: contact.name, email: contact.email, phone: contact.phone, origem: contact.origem },
    company: company ? { id: company.id, name: company.name } : null,
    owner: owner ? { id: owner.id, name: owner.name, active: owner.active } : null,
    stage,
  };
}

export function createFakeRepos(store: Store): Repos {
  const byId = <T extends { id: string }>(list: T[], id: string) => list.find((item) => item.id === id) ?? null;

  return {
    profiles: {
      getById: async (id) => byId(store.profiles, id),
      listActive: async () => store.profiles.filter((p) => p.active),
      listAll: async () => store.profiles,
      updateRole: async (id, role) => void Object.assign(byId(store.profiles, id)!, { role }),
      setActive: async (id, active) => void Object.assign(byId(store.profiles, id)!, { active }),
      countActiveGestores: async () => store.profiles.filter((p) => p.role === 'gestor' && p.active).length,
    },
    stages: {
      listOrdered: async () => [...store.stages].sort((a, b) => a.position - b.position),
      getById: async (id) => byId(store.stages, id),
      getByKey: async (key) => store.stages.find((s) => s.key === key) ?? null,
      insert: async (input) => {
        const stage = { ...input, id: newId('s') };
        store.stages.push(stage);
        return stage;
      },
      update: async (id, patch) => void Object.assign(byId(store.stages, id)!, patch),
      updatePositions: async (ids) => ids.forEach((id, index) => (byId(store.stages, id)!.position = index + 1)),
      delete: async (id) => void (store.stages = store.stages.filter((s) => s.id !== id)),
      countDeals: async (stageId) => store.deals.filter((d) => d.stageId === stageId).length,
    },
    deals: {
      getById: async (id) => {
        const deal = byId(store.deals, id);
        return deal ? toCard(store, deal) : null;
      },
      insert: async (input) => {
        const position = store.deals.filter((d) => d.stageId === input.stageId).length;
        const deal = makeDeal({ ...input, position });
        store.deals.push(deal);
        return deal;
      },
      update: async (id, patch) => {
        const clean = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
        Object.assign(byId(store.deals, id)!, clean);
      },
      move: async (dealId, stageId, index, patch = {}) => {
        store.moves.push({ dealId, stageId, index, patch });
        Object.assign(byId(store.deals, dealId)!, { stageId, position: index }, patch);
      },
      delete: async (id) => void (store.deals = store.deals.filter((d) => d.id !== id)),
      listToday: async (filter, today) =>
        store.deals
          .filter((d) => d.status === 'open' && d.nextActionDate && d.nextActionDate <= today)
          .filter((d) => filter.kind === 'team' || d.ownerId === filter.ownerId)
          .map((d) => toCard(store, d)),
      countToday: async (ownerId, today) =>
        store.deals.filter((d) => d.status === 'open' && d.ownerId === ownerId && (d.nextActionDate ?? '9') <= today).length,
      listBoard: async ({ ownerId }) =>
        store.deals.filter((d) => !ownerId || d.ownerId === ownerId).map((d) => toCard(store, d)),
      listByContact: async (contactId) =>
        store.deals.filter((d) => d.contactId === contactId).map((d) => toCard(store, d)),
    },
    activities: {
      insert: async (input) => {
        const author = byId(store.profiles, input.authorId);
        const activity: Activity = {
          id: newId('a'),
          dealId: input.dealId ?? null,
          contactId: input.contactId ?? null,
          type: input.type,
          content: input.content ?? null,
          metadata: input.metadata ?? {},
          author: author ? { id: author.id, name: author.name } : null,
          createdAt: new Date(Date.now() + store.activities.length).toISOString(),
        };
        store.activities.push(activity);
        return activity;
      },
      listByDeal: async (dealId) => store.activities.filter((a) => a.dealId === dealId),
      listByContact: async (contactId) => store.activities.filter((a) => a.contactId === contactId),
    },
    contacts: {
      insert: async (input) => {
        if (store.contacts.some((c) => c.email === input.email)) {
          throw new DomainError('CONTACT_EMAIL_TAKEN', 'Já existe um contato com este e-mail.');
        }
        const contact = { ...input, id: newId('c') };
        store.contacts.push(contact);
        return contact;
      },
      update: async (id, patch) => void Object.assign(byId(store.contacts, id)!, patch),
      getById: async (id) => {
        const contact = byId(store.contacts, id);
        if (!contact) return null;
        const company = byId(store.companies, contact.companyId ?? '');
        return { ...contact, company: company ? { id: company.id, name: company.name } : null };
      },
      findByEmail: async (email) => store.contacts.find((c) => c.email === email) ?? null,
      delete: async (id) => void (store.contacts = store.contacts.filter((c) => c.id !== id)),
      countDeals: async (contactId) => store.deals.filter((d) => d.contactId === contactId).length,
      search: async () => [],
      listByCompany: async (companyId) => store.contacts.filter((c) => c.companyId === companyId),
    },
    companies: {
      insert: async (input) => {
        const company = { ...input, id: newId('co') };
        store.companies.push(company);
        return company;
      },
      update: async (id, patch) => void Object.assign(byId(store.companies, id)!, patch),
      getById: async (id) => byId(store.companies, id),
      delete: async (id) => void (store.companies = store.companies.filter((c) => c.id !== id)),
      search: async () => [],
    },
  };
}
