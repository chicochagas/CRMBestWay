// Interfaces dos repositórios. Os serviços recebem `Repos` por parâmetro, o que permite
// testá-los com fakes em memória (tests/unit/fakes/repositories.ts).
import type {
  Activity,
  ActivityType,
  Company,
  Contact,
  Deal,
  DealCard,
  DealPatch,
  DealType,
  Origem,
  Profile,
  Role,
  Stage,
} from '@/lib/domain';

export type OwnerFilter = { kind: 'me'; ownerId: string } | { kind: 'owner'; ownerId: string } | { kind: 'team' };

export interface ProfilesRepo {
  getById(id: string): Promise<Profile | null>;
  listActive(): Promise<Profile[]>;
  listAll(): Promise<Profile[]>;
  updateRole(id: string, role: Role): Promise<void>;
  setActive(id: string, active: boolean): Promise<void>;
  countActiveGestores(): Promise<number>;
}

export interface StagesRepo {
  listOrdered(): Promise<Stage[]>;
  getById(id: string): Promise<Stage | null>;
  getByKey(key: string): Promise<Stage | null>;
  insert(input: Omit<Stage, 'id'>): Promise<Stage>;
  update(id: string, patch: Partial<Pick<Stage, 'name' | 'probability' | 'color'>>): Promise<void>;
  updatePositions(orderedIds: string[]): Promise<void>;
  delete(id: string): Promise<void>;
  countDeals(stageId: string): Promise<number>;
}

export type NewDeal = {
  contactId: string;
  stageId: string;
  ownerId: string | null;
  title: string;
  value: number;
  nextAction: string;
  nextActionDate: string;
};

export type DealUpdate = Partial<{
  title: string;
  value: number;
  ownerId: string | null;
  nextAction: string;
  nextActionDate: string;
}>;

export interface DealsRepo {
  getById(id: string): Promise<DealCard | null>;
  insert(input: NewDeal): Promise<Deal>;
  update(id: string, patch: DealUpdate): Promise<void>;
  move(dealId: string, stageId: string, index: number, patch?: DealPatch): Promise<void>;
  delete(id: string): Promise<void>;
  listToday(filter: OwnerFilter, today: string): Promise<DealCard[]>;
  countToday(ownerId: string, today: string): Promise<number>;
  listBoard(filter: { ownerId?: string }): Promise<DealCard[]>;
  listByContact(contactId: string): Promise<DealCard[]>;
}

export type NewActivity = {
  dealId?: string | null;
  contactId?: string | null;
  type: ActivityType;
  content?: string | null;
  metadata?: Record<string, unknown>;
  authorId: string;
};

export interface ActivitiesRepo {
  insert(input: NewActivity): Promise<Activity>;
  listByDeal(dealId: string): Promise<Activity[]>;
  listByContact(contactId: string): Promise<Activity[]>;
}

export type NewContact = {
  name: string;
  email: string;
  phone: string | null;
  companyId: string | null;
  origem: Origem;
};

export type ContactWithCompany = Contact & { company: { id: string; name: string } | null };

export interface ContactsRepo {
  insert(input: NewContact): Promise<Contact>;
  update(id: string, patch: Partial<NewContact>): Promise<void>;
  getById(id: string): Promise<ContactWithCompany | null>;
  findByEmail(email: string): Promise<Contact | null>;
  delete(id: string): Promise<void>;
  countDeals(contactId: string): Promise<number>;
  search(q: string): Promise<ContactWithCompany[]>;
  listByCompany(companyId: string): Promise<Contact[]>;
}

export interface CompaniesRepo {
  insert(input: { name: string; domain: string | null }): Promise<Company>;
  update(id: string, patch: Partial<{ name: string; domain: string | null }>): Promise<void>;
  getById(id: string): Promise<Company | null>;
  delete(id: string): Promise<void>;
  search(q: string): Promise<Company[]>;
}

export type Repos = {
  profiles: ProfilesRepo;
  stages: StagesRepo;
  deals: DealsRepo;
  activities: ActivitiesRepo;
  contacts: ContactsRepo;
  companies: CompaniesRepo;
};

export type { DealType };
