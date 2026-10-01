-- CRM da RedRex: schema inicial (PRD Apêndice A, emenda v2.2).
-- Single-org: membro ativo autenticado acessa. Policies em 20261001011359_rls.sql.

-- Perfis do time (dono dos deals, ranking de vendedores)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'vendedor' check (role in ('vendedor','gestor')),
  active boolean not null default true,                  -- desativado: sem login, preserva dono/autoria
  created_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  created_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  name text not null,
  email text unique not null,
  phone text,                 -- usado no WhatsApp click-to-send
  origem text not null default 'inbound' check (origem in ('inbound','outbound')),
  created_at timestamptz not null default now()
);

-- Etapas com probabilidade -> alimenta o forecast ponderado
create table public.stages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position int not null,
  probability int not null default 0 check (probability between 0 and 100),
  color text,
  kind text not null default 'open' check (kind in ('open','won','lost','standby')), -- define deals.status
  key text unique                       -- chave estável das etapas de sistema
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  stage_id uuid not null references public.stages(id),
  owner_id uuid references public.profiles(id),
  title text not null,
  value numeric(12,2) default 0,
  deal_type text not null default 'pontual' check (deal_type in ('pontual','recorrente')),
  mrr numeric(12,2) default 0,
  position int not null default 0,
  status text not null default 'open' check (status in ('open','won','lost','standby')),
  attendance text not null default 'pendente' check (attendance in ('pendente','compareceu','no_show','remarcado')),
  next_action text,
  next_action_date date,
  lost_reason text check (lost_reason in ('preço','timing','concorrente','sem_budget','sumiu','outro')),
  reaquecer_em date,
  calendly_event_uid text unique,       -- idempotência do polling do Calendly (nunca o título)
  qualified_at timestamptz,             -- 1a entrada em "Qualificado" (gate outbound)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- rede de segurança das regras de fechamento (fonte única: lib/services/deals/transitions.ts)
  constraint deals_open_has_next_action check (status <> 'open' or (nullif(trim(next_action),'') is not null and next_action_date is not null)),
  constraint deals_won_mrr check (status <> 'won' or deal_type = 'pontual' or mrr > 0),
  constraint deals_lost_reason check (status <> 'lost' or lost_reason is not null),
  constraint deals_standby_date check (status <> 'standby' or reaquecer_em is not null),
  constraint deals_value_nonneg check (value >= 0)
);

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  version int not null default 1,
  value numeric(12,2) not null default 0,
  status text not null default 'rascunho' check (status in ('rascunho','enviada','vista','aceita','recusada')),
  valid_until date,
  doc_url text,
  created_at timestamptz not null default now(),
  unique (deal_id, version)
);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('diagnostico','objecao','followup','proposta','reengajamento')),
  body text not null,
  created_at timestamptz not null default now()
);

-- Metas mensais (time = owner_id null; vendedor = owner_id setado)
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  month date not null,
  target_value numeric(12,2) not null,
  created_at timestamptz not null default now(),
  unique (owner_id, month)
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references public.deals(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  type text not null check (type in ('note','call_note','transcript','analysis','email','proposal',
                                     'stage_change','next_action_change')),
  content text,
  metadata jsonb default '{}'::jsonb,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint activities_has_target check (deal_id is not null or contact_id is not null)
);

-- Marca d'água do polling (otimização; a corretude vem do dedup por UUID)
create table public.sync_state (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

create index on public.deals (stage_id);
create index on public.deals (contact_id);
create index on public.deals (owner_id);
create index on public.deals (next_action_date);
create index on public.deals (status);
create index on public.deals (stage_id, position);
create index on public.contacts (company_id);
create index on public.proposals (deal_id);
create index on public.goals (month);
create index on public.activities (deal_id);
create index on public.activities (contact_id);
create index on public.activities (type);
create index on public.activities (author_id);
create index on public.activities (created_at desc);

-- updated_at só muda quando algo além da posição muda: renumerar a coluna do Kanban
-- não deve alterar o desempate por updated_at da lista "Hoje".
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (to_jsonb(new) - 'position' - 'updated_at') = (to_jsonb(old) - 'position' - 'updated_at') then
    return new;
  end if;
  new.updated_at = now();
  return new;
end $$;

create trigger deals_updated_at before update on public.deals
  for each row execute function public.set_updated_at();

alter table public.profiles   enable row level security;
alter table public.companies  enable row level security;
alter table public.contacts   enable row level security;
alter table public.stages     enable row level security;
alter table public.deals      enable row level security;
alter table public.proposals  enable row level security;
alter table public.templates  enable row level security;
alter table public.goals      enable row level security;
alter table public.activities enable row level security;
alter table public.sync_state enable row level security;
