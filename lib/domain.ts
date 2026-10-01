// Tipos de domínio (camelCase), independentes do formato do banco.

export type Role = 'vendedor' | 'gestor';
export type StageKind = 'open' | 'won' | 'lost' | 'standby';
export type DealStatus = StageKind;
export type DealType = 'pontual' | 'recorrente';
export type Origem = 'inbound' | 'outbound';
export type ActivityType =
  | 'note'
  | 'call_note'
  | 'transcript'
  | 'analysis'
  | 'email'
  | 'proposal'
  | 'stage_change'
  | 'next_action_change';

export const LOST_REASONS = ['preço', 'timing', 'concorrente', 'sem_budget', 'sumiu', 'outro'] as const;
export type LostReason = (typeof LOST_REASONS)[number];

export const LOST_REASON_LABELS: Record<LostReason, string> = {
  preço: 'Preço',
  timing: 'Timing',
  concorrente: 'Concorrente',
  sem_budget: 'Sem budget',
  sumiu: 'Sumiu',
  outro: 'Outro',
};

/** Chaves estáveis das etapas de sistema (não dependem do nome). */
export const STAGE_KEYS = {
  novoLead: 'novo_lead',
  qualificado: 'qualificado',
  diagnosticoAgendado: 'diagnostico_agendado',
} as const;

export type Profile = { id: string; name: string; role: Role; active: boolean };
export type Viewer = Profile & { email: string | null };
export type PersonRef = { id: string; name: string };

export type Stage = {
  id: string;
  name: string;
  position: number;
  probability: number;
  color: string | null;
  kind: StageKind;
  key: string | null;
};

export type Company = { id: string; name: string; domain: string | null };

export type Contact = {
  id: string;
  companyId: string | null;
  name: string;
  email: string;
  phone: string | null;
  origem: Origem;
};

export type Deal = {
  id: string;
  contactId: string;
  stageId: string;
  ownerId: string | null;
  title: string;
  value: number;
  dealType: DealType;
  mrr: number;
  position: number;
  status: DealStatus;
  nextAction: string | null;
  nextActionDate: string | null;
  lostReason: LostReason | null;
  reaquecerEm: string | null;
  qualifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Deal com o que os cards, "Hoje" e a página do deal mostram. */
export type DealCard = Deal & {
  contact: { id: string; name: string; email: string; phone: string | null; origem: Origem };
  company: PersonRef | null;
  owner: (PersonRef & { active: boolean }) | null;
  stage: Stage;
};

/** Campos que o movimento atômico (move_deal) pode gravar junto com a troca de etapa. */
export type DealPatch = Partial<{
  status: DealStatus;
  dealType: DealType;
  mrr: number;
  lostReason: LostReason | null;
  reaquecerEm: string | null;
  nextAction: string;
  nextActionDate: string;
  qualifiedAt: string;
}>;

export type Activity = {
  id: string;
  dealId: string | null;
  contactId: string | null;
  type: ActivityType;
  content: string | null;
  metadata: Record<string, unknown>;
  author: PersonRef | null;
  createdAt: string;
};
