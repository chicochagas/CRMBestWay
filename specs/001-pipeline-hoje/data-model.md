# Data Model: Pipeline comercial com próxima ação e tela "Hoje"

Base: PRD Apêndice A (`schema.sql`). Esta feature usa `profiles`, `companies`, `contacts`,
`stages`, `deals` e `activities`. As tabelas `proposals`, `templates`, `goals` e `sync_state` são
criadas na mesma migration inicial (o Apêndice A é o schema completo), mas só são usadas em
features futuras.

> ✅ **Aprovado em 2026-09-30.** Os deltas Δ1–Δ7 e a cor `#F97316` para "Diagnóstico agendado"
> foram aprovados e incorporados ao Apêndice A do PRD (emenda v2.2).

## Entidades

### profiles (Membro)

| Campo | Tipo | Regra |
|---|---|---|
| id | uuid PK → `auth.users.id` | criado pelo serviço de convite |
| name | text not null | obrigatório, 2–80 caracteres |
| role | `vendedor` \| `gestor` | só gestor altera |
| **active** | boolean not null default true | **Δ1**: desativado não entra no login nem aparece como opção de dono |
| created_at | timestamptz | |

### companies (Empresa)

| Campo | Tipo | Regra |
|---|---|---|
| id, name (not null), domain, created_at | conforme Apêndice A | `domain` normalizado em minúsculas, sem `https://`/`www.` |

1 empresa → N contatos.

### contacts (Contato)

| Campo | Tipo | Regra |
|---|---|---|
| company_id | uuid → companies, `on delete set null` | opcional |
| name | text not null | obrigatório |
| email | text unique not null | normalizado para minúsculas antes de gravar; duplicado → erro `CONTACT_EMAIL_TAKEN` com id do existente |
| phone | text | opcional; guardado em E.164 quando possível (útil ao WhatsApp futuro) |
| origem | `inbound` \| `outbound` | default do banco é `inbound`; o formulário manual envia `outbound` |

Exclusão de contato com deals é bloqueada no serviço (FR-008); o banco tem `on delete cascade` em
`deals.contact_id`, então o serviço é a única barreira (ver Δ6 para reforço por RLS).

### stages (Etapa)

| Campo | Tipo | Regra |
|---|---|---|
| name | text not null | |
| position | int not null | ordem do funil |
| probability | int | **Δ3**: `check (probability between 0 and 100)` |
| color | text | hex |
| **kind** | `open` \| `won` \| `lost` \| `standby` | **Δ2**: define o `deals.status` resultante |
| **key** | text unique null | **Δ2**: chave estável das etapas de sistema |

Etapas com `kind <> 'open'` ou com `key` não podem ser excluídas; etapas com deals também não
(FR-014).

### deals

Campos do Apêndice A, mais:

| Campo | Tipo | Regra |
|---|---|---|
| **qualified_at** | timestamptz null | **Δ4**: preenchido ao entrar em `qualificado` (ver transições) |

Validações (serviço = fonte; constraints = rede de segurança, **Δ6**):

- `status='open'` ⇒ `next_action` não vazio e `next_action_date` não nulo (FR-015)
- `status='won'` ⇒ `deal_type` informado explicitamente; se `recorrente`, `mrr > 0` (FR-016)
- `status='lost'` ⇒ `lost_reason` não nulo (FR-017)
- `status='standby'` ⇒ `reaquecer_em > hoje` no momento da transição (FR-018); no banco só
  `reaquecer_em is not null`
- `value >= 0`; `owner_id` default = usuário criador (FR-007); `owner_id` nulo = "sem dono"

Mapa de `lost_reason` (UI → banco): preço→`preço`, timing→`timing`, concorrente→`concorrente`,
sem budget→`sem_budget`, sumiu→`sumiu`, outro→`outro`.

### activities (Atividade)

| Campo | Tipo | Regra |
|---|---|---|
| deal_id | uuid null | |
| contact_id | uuid null | sempre preenchido quando há deal, para a timeline do contato ser uma única consulta |
| type | **Δ5**: + `stage_change`, `next_action_change` | |
| content | text | nota livre (`note`, `call_note`) |
| metadata | jsonb | `stage_change`: `{from_stage_id, to_stage_id, from_name, to_name}`; `next_action_change`: `{from, to}` com `{action, date}` |
| **author_id** | uuid → profiles null | **Δ5**: autor; nulo apenas para eventos de sistema futuros |

Pelo menos um entre `deal_id` e `contact_id` é obrigatório (`check`).

## Transições de estado do deal

```text
           ┌──────────────── open (etapas kind=open, ordenadas) ───────────────┐
 criar ──► │ Novo lead → Qualificado → Diag. agendado → … → Negociação          │
           └───┬───────────────────┬───────────────────────┬───────────────────┘
               │ won               │ lost                  │ standby
               ▼                   ▼                       ▼
            Ganho               Perdido                 Stand-by
       (deal_type, mrr*)     (lost_reason)          (reaquecer_em > hoje)
               │                   │                       │
               └──── reabrir (→ etapa open): exige next_action + data ─┘
```

| De → Para | Exige | Efeitos |
|---|---|---|
| qualquer → `open` | outbound sem `qualified_at` não pode ir para posição ≥ `diagnostico_agendado` | atualiza `stage_id`/`position`; `stage_change` |
| qualquer → etapa `key='qualificado'` | — | `qualified_at = coalesce(qualified_at, now())` |
| `open` → `won` | `deal_type`; `mrr>0` se recorrente; gate Qualificado (outbound) | `status=won` |
| `open` → `lost` | `lost_reason` | `status=lost` |
| `open` → `standby` | `reaquecer_em` futura | `status=standby` |
| `won`/`lost`/`standby` → `open` | nova `next_action` + data | `status=open`; limpa `lost_reason`/`reaquecer_em`; `stage_change` + `next_action_change` |
| cancelar diálogo | — | nenhum efeito (o client faz rollback do card) |

Toda alteração de `next_action`/`next_action_date` gera `next_action_change`. Toda troca de
etapa gera `stage_change` (alimenta o futuro KPI de tempo por etapa).

## Deltas em relação ao Apêndice A

Diff proposto para a migration `20261001011348_init.sql` (+ `20261001011359_rls.sql`, `20261001011421_move_deal.sql`), aplicado sobre o Apêndice A:

```diff
 create table public.profiles (
   id uuid primary key references auth.users(id) on delete cascade,
   name text not null,
   role text not null default 'vendedor' check (role in ('vendedor','gestor')),
+  active boolean not null default true,                                   -- Δ1
   created_at timestamptz not null default now()
 );

 create table public.stages (
   id uuid primary key default gen_random_uuid(),
   name text not null,
   position int not null,
-  probability int not null default 0,
+  probability int not null default 0 check (probability between 0 and 100), -- Δ3
-  color text
+  color text,
+  kind text not null default 'open' check (kind in ('open','won','lost','standby')), -- Δ2
+  key text unique                                                         -- Δ2
 );

 create table public.deals (
   …
   calendly_event_uid text unique,
+  qualified_at timestamptz,                                               -- Δ4
   created_at timestamptz not null default now(),
-  updated_at timestamptz not null default now()
+  updated_at timestamptz not null default now(),
+  -- Δ6: rede de segurança das regras de fechamento (fonte: lib/services/deals/transitions.ts)
+  constraint deals_open_has_next_action check (status <> 'open' or (nullif(trim(next_action),'') is not null and next_action_date is not null)),
+  constraint deals_won_mrr check (status <> 'won' or deal_type = 'pontual' or mrr > 0),
+  constraint deals_lost_reason check (status <> 'lost' or lost_reason is not null),
+  constraint deals_standby_date check (status <> 'standby' or reaquecer_em is not null),
+  constraint deals_value_nonneg check (value >= 0)
 );

 create table public.activities (
   id uuid primary key default gen_random_uuid(),
   deal_id uuid references public.deals(id) on delete cascade,
   contact_id uuid references public.contacts(id) on delete cascade,
-  type text not null check (type in ('note','call_note','transcript','analysis','email','proposal')),
+  type text not null check (type in ('note','call_note','transcript','analysis','email','proposal',
+                                     'stage_change','next_action_change')),   -- Δ5
   content text,
   metadata jsonb default '{}'::jsonb,
+  author_id uuid references public.profiles(id) on delete set null,       -- Δ5
-  created_at timestamptz not null default now()
+  created_at timestamptz not null default now(),
+  constraint activities_has_target check (deal_id is not null or contact_id is not null)
 );

+create index on public.deals (stage_id, position);                        -- ordem da coluna
+create index on public.activities (created_at desc);
+create trigger deals_updated_at before update on public.deals
+  for each row execute function public.set_updated_at();                  -- função utilitária

+-- Δ6/Δ7: RLS por papel (substitui as policies "for all" de stages, deals e profiles)
+create function private.is_gestor() returns boolean language sql stable security definer
+  set search_path = '' as $$
+  select exists (select 1 from public.profiles
+                 where id = auth.uid() and role = 'gestor' and active) $$;
+create function private.is_active_member() returns boolean language sql stable security definer
+  set search_path = '' as $$
+  select exists (select 1 from public.profiles where id = auth.uid() and active) $$;
+-- todas as tabelas: select/insert/update exigem is_active_member()
+-- stages: insert/update/delete só is_gestor()
+-- deals: delete só is_gestor()
+-- profiles: update/delete só is_gestor(); insert só via secret key (serviço de convite)
+-- contacts: delete só sem deals (policy com not exists em deals)
+-- activities: insert com check (author_id = auth.uid())   -- impede autoria em nome de outro

+-- Δ7: movimento atômico: renumera as colunas e aplica p_patch (whitelist: status, deal_type, mrr,
+-- lost_reason, reaquecer_em, next_action, next_action_date, qualified_at) na mesma transação.
+-- Regras de negócio continuam só no serviço.
+create function public.move_deal(p_deal_id uuid, p_stage_id uuid, p_index int, p_patch jsonb default '{}'::jsonb)
+  returns void language plpgsql security invoker set search_path = '' as $$ … $$;

 -- seed: etapas
-insert into public.stages (name, position, probability, color) values
-  ('Novo lead', 1, 5, '#A1A1AA'), …
+insert into public.stages (name, position, probability, color, kind, key) values
+  ('Novo lead',             1,   5, '#A1A1AA', 'open',    'novo_lead'),
+  ('Qualificado',           2,  15, '#818CF8', 'open',    'qualificado'),
+  ('Diagnóstico agendado',  3,  25, '#F97316', 'open',    'diagnostico_agendado'),
+  ('Diagnóstico realizado', 4,  40, '#F87171', 'open',    null),
+  ('Proposta enviada',      5,  60, '#F59E0B', 'open',    null),
+  ('Negociação',            6,  80, '#3B82F6', 'open',    null),
+  ('Ganho',                 7, 100, '#22C55E', 'won',     'ganho'),
+  ('Perdido',               8,   0, '#71717A', 'lost',    'perdido'),
+  ('Stand-by',              9,  10, '#EAB308', 'standby', 'standby');
```

**Decisão de design (aprovada)**: "Diagnóstico agendado" usa `#F97316` (laranja) no lugar de
`#DC2626`, que o §14 reserva para atraso/erro.
