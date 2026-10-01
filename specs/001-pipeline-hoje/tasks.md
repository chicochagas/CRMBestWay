---

description: "Task list for feature 001-pipeline-hoje"
---

# Tasks: Pipeline comercial com próxima ação e tela "Hoje"

**Input**: Design documents from `/specs/001-pipeline-hoje/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: a spec não pede TDD, mas a constituição (princípio V) exige testes de unidade nos
serviços com regra de negócio. Por isso, há tarefas de teste Vitest para os serviços de cada
história. O E2E (Playwright) é opcional e fica no Polish.

**Organization**: tarefas agrupadas por user story, na ordem de prioridade da spec (P1: US1, US2,
US3, US6 → P2: US4, US5 → P3: US7).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: história a que a tarefa pertence (US1…US7)
- Caminhos relativos à raiz do repositório (monolito Next.js, ver plan.md → Project Structure)

## Convenções que valem para todas as tarefas

- Server Actions seguem [contracts/server-actions.md](./contracts/server-actions.md): sessão →
  zod → **um** serviço → `revalidatePath` → `ActionResult<T>`. Mensagens em pt-BR.
- Regra de negócio só em `lib/services/`; acesso ao banco só em `lib/supabase/repositories/`.
- Server Components por padrão; `'use client'` só em DnD, formulários e diálogos.
- Arquivo acima de ~300 linhas deve ser quebrado. Datas `YYYY-MM-DD`; "hoje" sempre via
  `todayInSaoPaulo()`.
- Toda escrita de atividade ligada a deal preenche `deal_id` **e** `contact_id`, e `author_id` =
  usuário logado.
- Antes de marcar qualquer tarefa como pronta: `npm run lint` e `npm run typecheck` sem erros.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: inicializar o projeto Next.js e as ferramentas

- [x] T001 Criar o app Next.js 16 na raiz do repositório (TypeScript, App Router, ESLint, Tailwind 4, sem `src/`, alias `@/*`, npm). Como a raiz não está vazia, gerar com `npx create-next-app@latest` numa pasta temporária e mover para a raiz, preservando `.env`, `.env.example`, `.llm/`, `.specify/`, `.claude/`, `specs/`, `CLAUDE.md` e mesclando o `.gitignore` gerado com o existente (manter `.env`, `.env*.local` e `!.env.example`) em `package.json`, `app/`, `next.config.ts`, `tsconfig.json`
- [x] T002 Instalar dependências em `package.json`: `@supabase/ssr`, `@supabase/supabase-js`, `zod`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `server-only`; dev: `vitest`, `supabase` (CLI), `@playwright/test`
- [x] T003 [P] Adicionar scripts em `package.json`: `lint` (`eslint .`; o Next 16 não tem mais `next lint`), `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `test:e2e` (`playwright test`), `db:types` (`supabase gen types typescript --project-id ciajeyaoqyjnozeewest > lib/supabase/types.ts`)
- [x] T004 [P] Ativar `"strict": true` e `"noUncheckedIndexedAccess": true` em `tsconfig.json`
- [x] T005 [P] Inicializar shadcn/ui (`npx shadcn@latest init`) e adicionar `button input label textarea select dialog dropdown-menu badge card table sonner` em `components/ui/`
- [x] T006 [P] Definir os tokens de design via `@theme` em `app/globals.css`: `background #F6F4EF`, `surface #FFFFFF`, `border #E7E3DB`, `primary #18181B`, `accent #4D7C0F`, `lime #A3E635`, `text #1A1A1A`, `text-muted #6B7280`, `danger #DC2626` (só atraso/erro), raio de card `16px`, pill `9999px`; `body` com fundo `background`
- [x] T007 [P] Rodar `npx supabase init` (gera `supabase/config.toml`; `[db.seed] sql_paths = ['./seed.sql']`) e criar `scripts/db-push.mjs`, que roda `supabase db push --db-url <DATABASE_URL> --include-seed` lendo a URL de `process.env`; script `"db:push": "node --env-file=.env scripts/db-push.mjs"` em `package.json` (funciona em PowerShell e bash)
- [x] T008 [P] Criar `vitest.config.ts` (ambiente `node`, alias `@` → raiz, `include: ['tests/unit/**/*.test.ts']`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: schema, auth, clientes Supabase e base de repositórios/serviços usados por todas as histórias

**⚠️ CRITICAL**: nenhuma história começa antes desta fase. **T009 é um gate humano.**

- [x] T009 **GATE HUMANO** (aprovado em 2026-09-30; cor `#F97316`; emenda v2.2 aplicada em `.llm/prd.md`): apresentar ao usuário o diff de [data-model.md → Deltas](./data-model.md#deltas-em-relação-ao-apêndice-a) (Δ1–Δ7) e a decisão de cor de "Diagnóstico agendado" (`#DC2626` → sugestão `#F97316`). Só depois da aprovação, registrar a emenda no Apêndice A e um changelog curto em `.llm/prd.md`. **Não seguir para T010 sem aprovação explícita.**
- [x] T010 Escrever `supabase/migrations/20261001011348_init.sql` com todo o Apêndice A aprovado + deltas: `profiles.active boolean not null default true`; `stages.probability … check (probability between 0 and 100)`, `stages.kind text not null default 'open' check (kind in ('open','won','lost','standby'))`, `stages.key text unique`; `deals.qualified_at timestamptz` e as constraints `deals_open_has_next_action check (status <> 'open' or (nullif(trim(next_action),'') is not null and next_action_date is not null))`, `deals_won_mrr check (status <> 'won' or deal_type = 'pontual' or mrr > 0)`, `deals_lost_reason check (status <> 'lost' or lost_reason is not null)`, `deals_standby_date check (status <> 'standby' or reaquecer_em is not null)`, `deals_value_nonneg check (value >= 0)`; `activities.type` com `'stage_change','next_action_change'`, `activities.author_id uuid references public.profiles(id) on delete set null`, `activities_has_target check (deal_id is not null or contact_id is not null)`; índices `deals (stage_id, position)` e `activities (created_at desc)`; função `public.set_updated_at()` + trigger `deals_updated_at`
- [x] T011 Escrever as policies de RLS em `supabase/migrations/20261001011359_rls.sql`: funções `public.is_active_member()` e `public.is_gestor()` (`language sql stable security definer set search_path = ''`, conforme data-model.md); RLS habilitado em **todas** as 10 tabelas; `select/insert/update` exigem `is_active_member()`; `stages` insert/update/delete só `is_gestor()`; `deals` delete só `is_gestor()`; `profiles` update/delete só `is_gestor()` e sem policy de insert (insert só pela secret key); `contacts` delete só quando `not exists (select 1 from public.deals d where d.contact_id = contacts.id)`; `activities` insert com `with check (is_active_member() and author_id = auth.uid())`
- [x] T012 Escrever `public.move_deal(p_deal_id uuid, p_stage_id uuid, p_index int, p_patch jsonb default '{}'::jsonb) returns void` em `supabase/migrations/20261001011421_move_deal.sql` (`language plpgsql security invoker set search_path = ''`): trava as linhas das colunas de origem e destino (`for update`), limita `p_index` a `[0, n]`, atualiza `stage_id`, renumera as duas colunas em `0..n-1` e, **na mesma transação**, aplica `p_patch` aceitando só `status`, `deal_type`, `mrr`, `lost_reason`, `reaquecer_em`, `next_action`, `next_action_date`, `qualified_at` (chave fora da lista → `raise exception`); **não** valida regra de negócio ([contracts/routes.md → RPC](./contracts/routes.md#rpc-do-banco))
- [x] T013 Escrever o seed das 9 etapas com `kind` e `key` (tabela do data-model.md, com a cor decidida em T009) em `supabase/seed.sql`
- [x] T014 Aplicar as migrations e o seed no projeto `ciajeyaoqyjnozeewest` (`npm run db:push`) e rodar `get_advisors` (security); corrigir qualquer alerta de RLS antes de seguir
- [x] T015 Gerar os tipos do banco com `npm run db:types` em `lib/supabase/types.ts`
- [x] T016 [P] Criar `lib/env.ts`: schema zod separando `publicEnv` (`NEXT_PUBLIC_SUPABASE_URL` url, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` string não vazia) de `serverEnv` (`SUPABASE_SECRET_KEY` não vazia, `SITE_URL` url (base do link de convite), em módulo com `import 'server-only'`); falhar na carga com mensagem que lista as variáveis faltando, sem imprimir valores
- [x] T017 [P] Criar `lib/dates.ts`: `todayInSaoPaulo(now = new Date()): string` (`Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' })` → `YYYY-MM-DD`), `daysBetween(from, to): number`, `daysOverdue(date, today): number` (≥ 0), `isAfter(date, today): boolean`
- [x] T018 [P] Criar `lib/format.ts`: `formatBRL(value)` (`Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`), `formatDate(YYYY-MM-DD)` → `dd/mm/aaaa`, `formatDateTime(iso)` em `America/Sao_Paulo`
- [x] T019 [P] Criar `lib/services/errors.ts` com `class DomainError { code: ErrorCode; message: string; field?: string; meta?: Record<string, unknown> }` e o tipo `ErrorCode` exato de [contracts/server-actions.md](./contracts/server-actions.md)
- [x] T020 [P] Criar `lib/actions/result.ts` com `ActionResult<T>`, `ok(data)`, `fail(...)`, `fromZodError(err)` (→ `VALIDATION` + `fieldErrors`) e `runAction(fn)`, que converte `DomainError` em `ActionResult` e loga erro inesperado sem PII (só `code` e ids)
- [x] T021 [P] Criar os clientes Supabase: `lib/supabase/server.ts` (`createServerClient` do `@supabase/ssr` com `cookies()` do Next) e `lib/supabase/browser.ts` (`createBrowserClient`), ambos tipados com `Database` de `lib/supabase/types.ts` e usando `publicEnv`
- [x] T022 [P] Criar `lib/supabase/admin.ts` com `import 'server-only'` e `createClient(url, SUPABASE_SECRET_KEY, { auth: { persistSession: false } })`; nenhum outro arquivo importa a secret key
- [x] T023 Criar `proxy.ts` (Next 16): renova a sessão com `@supabase/ssr` e redireciona para `/login?next=<rota>` toda rota sem usuário, exceto `/login`, `/auth/confirm`, `/definir-senha`, `/_next`, arquivos estáticos e `favicon.ico` (FR-001)
- [x] T024 Criar `lib/auth/getViewer.ts`: `getViewer(): Promise<Viewer>` com `{ id, name, role: 'vendedor'|'gestor', active }` a partir de `auth.getUser()` + `profiles`; sem usuário, perfil ou com `active=false` → `signOut` + `redirect('/login')`. Também `requireGestor(viewer)`, que lança `DomainError('FORBIDDEN')`
- [x] T025 [P] Criar as interfaces dos repositórios em `lib/supabase/repositories/types.ts` (`ProfilesRepo`, `StagesRepo`, `DealsRepo`, `ActivitiesRepo`, `ContactsRepo`, `CompaniesRepo`) com os tipos de domínio (`Deal`, `Stage`, `Profile`, `Activity`, `Contact`, `Company`) mapeados de `types.ts` para camelCase. Os serviços recebem os repositórios por parâmetro (injeção) para serem testáveis
- [x] T026 [P] Implementar `lib/supabase/repositories/profiles.ts`: `getById`, `listActive()` (ordenado por nome), `listAll()`
- [x] T027 [P] Implementar `lib/supabase/repositories/stages.ts`: `listOrdered()`, `getById`, `getByKey(key)`
- [x] T028 [P] Implementar a base de `lib/supabase/repositories/deals.ts`: `getById` (com contato, empresa, dono e etapa), `insert`, `update(id, patch)`, `move(dealId, stageId, index, patch?)` → `rpc('move_deal', { p_deal_id, p_stage_id, p_index, p_patch })` (patch em snake_case)
- [x] T029 [P] Implementar a base de `lib/supabase/repositories/activities.ts`: `insert({ dealId?, contactId?, type, content?, metadata?, authorId })`
- [x] T030 [P] Criar fakes em memória das interfaces de T025 para os testes em `tests/unit/fakes/repositories.ts`
- [x] T031 Criar o login: `app/(auth)/login/page.tsx` + `components/auth/LoginForm.tsx` (client: `createBrowserClient().auth.signInWithPassword` **direto no Supabase Auth**, sem Server Action, para herdar o rate limit nativo por IP (constituição §IV); qualquer erro, inclusive usuário banido, vira "E-mail ou senha inválidos"; erro de rate limit vira "Muitas tentativas, aguarde alguns minutos"; sucesso → `router.replace(next ?? '/')` + `router.refresh()`) + `app/actions/auth.ts` só com `signOut()` (encerra a sessão e redireciona para `/login`) (FR-001, FR-004)
- [x] T032 Criar o layout do CRM `app/(crm)/layout.tsx` (chama `getViewer()`) com `components/layout/Sidebar.tsx` (logo, links Hoje / Pipeline / Contatos; "Configurações" só para gestor) e `components/layout/UserMenu.tsx` (nome, papel, botão Sair → `signOut`), no visual do `.llm/crm.png`
- [x] T033 [P] Criar `app/(crm)/page.tsx`, que redireciona para `/pipeline` (até o dashboard existir)
- [x] T034 [P] Criar `supabase/seed.dev.sql` com dados de desenvolvimento parametrizados por e-mail de dois usuários (gestor e vendedor): 2 empresas, 4 contatos (inbound/outbound) e 6 deals em etapas variadas, com `next_action_date` em atraso, hoje e futuro. Não roda em produção
- [ ] T035 Provisionar o primeiro gestor conforme [quickstart.md → Pré-requisitos](./quickstart.md#pré-requisitos) (convite pelo dashboard + `insert` em `profiles` com `role='gestor'`) e, no Supabase Auth: **desligar "Allow new users to sign up"**, conferir **Rate Limits** (login por IP), definir **Site URL** e o template **Invite user** com `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite`; validar login/logout manualmente

**Checkpoint**: login funciona, rotas protegidas, schema com RLS aplicado; histórias podem começar.

---

## Phase 3: User Story 1 - Ver o que fazer hoje (Priority: P1) 🎯 MVP

**Goal**: o vendedor vê os follow-ups de hoje e atrasados (atrasados primeiro), conclui e reagenda sem sair da tela.

**Independent Test**: com deals do `seed.dev.sql`, o vendedor abre `/hoje`, vê só os seus itens (atrasados primeiro, com dias), reagenda um para +5 dias e o item sai da lista; o gestor filtra por vendedor e por "time".

### Tests for User Story 1

- [x] T036 [P] [US1] Testes de `lib/dates.ts` em `tests/unit/lib/dates.test.ts`: virada do dia em São Paulo (ex.: `2026-09-30T02:30Z` → `2026-09-29`), `daysOverdue` 0/3
- [x] T037 [P] [US1] Testes de `getTodayList` em `tests/unit/services/getTodayList.test.ts`: cenário US1-1 (2 hoje + 1 atrasado 3 dias + 1 amanhã → 3 itens, atrasado primeiro com `daysOverdue=3`), exclui `status<>'open'`, vendedor com `owner='team'` é forçado a `me`, gestor `team` inclui deals sem dono, lista vazia
- [x] T038 [P] [US1] Testes de `setNextAction` em `tests/unit/services/setNextAction.test.ts`: exige `nextAction` não vazio e data (`NEXT_ACTION_REQUIRED`), deal não `open` → `CONFLICT`, `completedNote` gera `note` antes do `next_action_change`, metadata `{from:{action,date}, to:{action,date}}`

### Implementation for User Story 1

- [x] T039 [P] [US1] Criar `lib/validation/nextAction.ts`: `nextAction` string com trim, 1–200 caracteres; `nextActionDate` `YYYY-MM-DD` válido (data passada é permitida e entra como atrasada); `completedNote` opcional, até 5000 caracteres
- [x] T040 [US1] Adicionar `listToday({ ownerFilter: { kind: 'me'|'owner'|'team', ownerId? }, today })` e `countToday(ownerId, today)` em `lib/supabase/repositories/deals.ts`: `status='open' and next_action_date <= today`, ordenando por `next_action_date asc, updated_at asc`, com join em contato (nome, e-mail, telefone), etapa e dono
- [x] T041 [US1] Implementar `lib/services/today/getTodayList.ts` (`getTodayList(repos, viewer, { owner, today }) → TodayItem[]` com `daysOverdue`; vendedor sempre `me`) e `countToday`, com o tipo `TodayItem` de [contracts/routes.md](./contracts/routes.md#leituras-serviços-chamados-por-server-components)
- [x] T042 [US1] Implementar `lib/services/deals/setNextAction.ts`: valida o deal `open`, grava `next_action`/`next_action_date` e cria as atividades (`note` com `completedNote`, se houver, e `next_action_change`) com `deal_id`, `contact_id` e `author_id`
- [x] T043 [US1] Criar a action `setNextAction` em `app/actions/deals.ts` (zod de T039 → serviço → `revalidatePath('/hoje')`, `('/pipeline')` e `('/deals/[id]')`)
- [x] T044 [P] [US1] Criar `components/deals/NextActionBadge.tsx`: mostra ação + data; atrasada em vermelho `#DC2626` com "há N dias"; hoje com destaque `accent`
- [x] T045 [P] [US1] Criar `components/deals/NextActionForm.tsx` (client): campos "O que foi feito (opcional)", "Próxima ação" e "Data", chama `setNextAction`, mostra erros por campo e toast de sucesso
- [x] T046 [US1] Criar `components/today/TodayItem.tsx` (client: expande o `NextActionForm` inline) e `components/today/TodayList.tsx` (server: agrupa "Atrasados" e "Hoje"; cada item mostra próxima ação, dias de atraso, deal (link para `/deals/[id]`), contato com telefone/e-mail, etapa e valor via `formatBRL`; estado vazio "Você está em dia 🎉") (FR-022, US1-5)
- [x] T047 [P] [US1] Criar `components/today/OwnerFilter.tsx` (client, só renderizado para gestor): opções "Meus", cada membro ativo e "Time", sincronizado com `?owner=`
- [x] T048 [US1] Criar `app/(crm)/hoje/page.tsx`: lê `searchParams.owner`, chama `getTodayList` com `today = todayInSaoPaulo()` e compõe `OwnerFilter` + `TodayList` (FR-021, FR-024, FR-025)
- [x] T049 [US1] Criar `components/layout/TodayCounter.tsx` (server, `countToday` do usuário logado) e exibi-lo ao lado do link "Hoje" em `components/layout/Sidebar.tsx` (FR-026)

**Checkpoint**: "Hoje" funcional e testável sozinho com dados de seed.

---

## Phase 4: User Story 2 - Trabalhar o pipeline no Kanban (Priority: P1)

**Goal**: Kanban por etapa com totais, cards completos, arrastar entre etapas e reordenar, com persistência igual para todos.

**Independent Test**: com deals de seed, arrastar entre etapas abertas e reordenar; recarregar e abrir com outro usuário mostra a mesma ordem; filtro por dono e busca funcionam.

### Tests for User Story 2

- [x] T050 [P] [US2] Testes de `moveDeal` (destinos `kind='open'`) em `tests/unit/services/moveDeal.test.ts`: chama `deals.move` com o índice, gera `stage_change` com metadata `{from_stage_id, to_stage_id, from_name, to_name}`, preenche `qualified_at` ao entrar em `key='qualificado'` sem sobrescrever o valor existente, e reordenar na mesma coluna **não** gera `stage_change`
- [x] T051 [P] [US2] Testes de `getBoard` em `tests/unit/services/getBoard.test.ts`: colunas por `position`, contagem e soma de `value` por coluna sobre os deals filtrados, filtro `owner`, busca `q`

### Implementation for User Story 2

- [x] T052 [US2] Adicionar `listBoard({ ownerId?, q? })` em `lib/supabase/repositories/deals.ts`: todos os deals (qualquer status) com contato, empresa e dono, ordenados por `stage_id, position`; `q` com `ilike` em `deals.title`, `contacts.name` e `companies.name`
- [x] T053 [US2] Implementar `lib/services/deals/getBoard.ts`: monta `Column[]` (`{ stage: {id,name,probability,color,kind}, deals, count, total }`). Os totais são soma simples de `value`; **não** é forecast ponderado (princípio V)
- [x] T054 [US2] Implementar `lib/services/deals/moveDeal.ts` para destinos `kind='open'` e deal `open`: uma chamada `deals.move(..., { qualified_at })` (patch só quando entra em `qualificado` pela primeira vez) e atividade `stage_change` (com `contact_id` e `author_id`). Deixar o ponto de extensão para `validateTransition` (US4)
- [x] T055 [US2] Criar a action `moveDeal({ dealId, toStageId, toIndex })` em `app/actions/deals.ts` (`toIndex` int ≥ 0; revalida `/pipeline` e `/hoje`)
- [x] T056 [P] [US2] Criar `components/pipeline/KanbanCard.tsx` (client, `useSortable`): título, contato/empresa, dono (ou "Sem dono"), valor `formatBRL`, `NextActionBadge`; clique abre `/deals/[id]`
- [x] T057 [P] [US2] Criar `components/pipeline/KanbanColumn.tsx` (client, `SortableContext`): cabeçalho com cor, nome, `probability`%, contagem e soma; corpo com rolagem vertical para colunas longas
- [x] T058 [US2] Criar `components/pipeline/KanbanBoard.tsx` (client, `DndContext`): atualização otimista no `onDragEnd`, chama `moveDeal` e, em erro, rollback do estado + toast com a mensagem do `ActionResult` (edge case "falha ao salvar arraste"); rolagem horizontal das colunas
- [x] T059 [P] [US2] Criar `components/pipeline/PipelineFilters.tsx` (client): select de dono (membros ativos + "Todos") e busca com debounce de 300 ms, sincronizados com `?owner=` e `?q=`
- [x] T060 [US2] Criar `app/(crm)/pipeline/page.tsx`: lê `searchParams`, chama `getBoard` e compõe `PipelineFilters` + `KanbanBoard`

**Checkpoint**: Kanban funcional para etapas abertas; US1 continua funcionando.

---

## Phase 5: User Story 3 - Cadastrar empresa, contato e deal (Priority: P1)

**Goal**: cadastro manual de lead outbound (empresa + contato + deal) que já nasce com dono e próxima ação; busca e edição.

**Independent Test**: criar empresa → contato → deal; o deal aparece em "Novo lead" no Kanban e, se a ação for para hoje, em `/hoje`; e-mail duplicado é avisado com link para o contato existente.

### Tests for User Story 3

- [x] T061 [P] [US3] Testes de `createDeal` em `tests/unit/services/createDeal.test.ts`: sem `nextAction`/data → `NEXT_ACTION_REQUIRED`; `ownerId` ausente → criador; etapa inicial `key='novo_lead'`, posição no fim da coluna; contato inexistente → `NOT_FOUND`
- [x] T062 [P] [US3] Testes de `createContact` e `createLead` em `tests/unit/services/contacts.test.ts`: e-mail normalizado para minúsculas; duplicado (`Ana@X.com` × `ana@x.com`) → `CONTACT_EMAIL_TAKEN` com `meta.existingId`; `origem` default `outbound`; `createLead` remove contato e empresa criados quando o deal falha; `deleteContact` com deals → `CONTACT_HAS_DEALS`

### Implementation for User Story 3

- [x] T063 [P] [US3] Criar `lib/validation/company.ts`: `name` obrigatório (trim, 1–120); `domain` opcional, normalizado em minúsculas, sem `https://`/`http://`/`www.` e sem barra final
- [x] T064 [P] [US3] Criar `lib/validation/contact.ts`: `name` obrigatório (trim, 1–120); `email` obrigatório, formato e-mail, `toLowerCase()`; `phone` opcional (normaliza para E.164 com `+55` quando vier só com dígitos brasileiros); `companyId` uuid opcional; `origem` `'inbound'|'outbound'` default `'outbound'`
- [x] T065 [P] [US3] Criar `lib/validation/deal.ts`: `contactId` uuid; `title` obrigatório (trim, 1–160); `value` número ≥ 0 com 2 casas (default 0); `ownerId` uuid opcional/nulo; `nextAction`/`nextActionDate` reaproveitando `lib/validation/nextAction.ts`
- [x] T066 [P] [US3] Implementar `lib/supabase/repositories/companies.ts`: `insert`, `update`, `getById` (com contatos), `delete`, `search(q)` (`ilike` em `name`/`domain`, limite 50)
- [x] T067 [P] [US3] Implementar `lib/supabase/repositories/contacts.ts`: `insert` (mapeia `23505` em `email` → `DomainError('CONTACT_EMAIL_TAKEN')`), `update`, `getById` (com empresa e deals), `findByEmail`, `delete`, `countDeals(contactId)`, `search(q)` (`ilike` em nome, e-mail e nome da empresa, limite 50)
- [x] T068 [US3] Implementar `lib/services/companies/{createCompany,updateCompany}.ts`
- [x] T069 [US3] Implementar `lib/services/contacts/{createContact,updateContact,deleteContact}.ts`: pré-checa `findByEmail` para devolver `existingId`; `deleteContact` bloqueia com deals (FR-008)
- [x] T070 [US3] Implementar `lib/services/deals/createDeal.ts` (dono default = criador, etapa `novo_lead`, posição = fim da coluna, `status='open'`) e `lib/services/deals/updateDeal.ts` (`title`, `value`, `ownerId` aceita `null`; trocar o dono só para um membro ativo)
- [x] T071 [US3] Implementar `lib/services/leads/createLead.ts`: empresa (existente ou nova) → contato (existente ou novo) → deal; em falha, desfaz somente o que esta chamada criou
- [x] T072 [US3] Criar as actions `createCompany`/`updateCompany` em `app/actions/companies.ts`, `createContact`/`updateContact`/`deleteContact`/`createLead` em `app/actions/contacts.ts` e `createDeal`/`updateDeal` em `app/actions/deals.ts` (revalidam `/contacts`, `/pipeline`, `/hoje`)
- [x] T073 [P] [US3] Criar `components/deals/OwnerSelect.tsx`: lista só membros ativos; quando o dono atual está inativo, mostra o nome dele como opção selecionada e desabilitada
- [x] T074 [P] [US3] Criar `components/contacts/CompanyForm.tsx` e `components/contacts/ContactForm.tsx` (client); no `CONTACT_EMAIL_TAKEN`, mostrar "Já existe um contato com este e-mail" + link "Abrir contato" para `/contacts/[existingId]`
- [x] T075 [US3] Criar `components/leads/NewLeadDialog.tsx` (client): passo único com empresa (buscar existente ou nova), contato (buscar existente ou novo) e deal (título, valor, `OwnerSelect`, próxima ação + data obrigatórias); chama `createLead`; botão "Novo lead" no topo de `/pipeline` e de `/contacts`
- [x] T076 [P] [US3] Criar `components/deals/DealForm.tsx` (client: editar título, valor e dono via `updateDeal`)
- [x] T077 [US3] Criar `app/(crm)/contacts/page.tsx`: busca `?q=` em contatos e empresas (Server Component), resultados com links e botão "Novo lead"
- [x] T078 [US3] Criar `app/(crm)/contacts/[id]/page.tsx` (dados + `ContactForm` + lista de deals do contato + "Novo deal para este contato" reaproveitando `NewLeadDialog` com o contato fixo) e `app/(crm)/companies/[id]/page.tsx` (dados + `CompanyForm` + contatos)
- [x] T079 [US3] Criar `app/(crm)/deals/[id]/page.tsx`: cabeçalho (título, etapa, status, valor, dono, contato/empresa com links), `DealForm` e `NextActionForm` (`notFound()` se não existir)

**Checkpoint**: P1 de cadastro completo; US1 e US2 funcionam com dados criados pela UI.

---

## Phase 6: User Story 6 - Acesso do time e perfis (Priority: P1)

**Goal**: o gestor convida, muda papel e desativa membros; desativado perde acesso e some das opções de dono. (Login/logout/proteção de rotas já entraram na Phase 2.)

**Independent Test**: o gestor convida um vendedor, que abre o link do e-mail, define a senha, entra e aparece como opção de dono; ao ser desativado, perde o acesso e os deals dele mantêm o nome; vendedor não acessa `/settings/members`.

### Tests for User Story 6

- [x] T080 [P] [US6] Testes de `manageMembers` em `tests/unit/services/manageMembers.test.ts` (Auth admin com fake): não-gestor → `FORBIDDEN`; convite cria usuário + profile, e falha no profile apaga o usuário criado; e-mail existente → `CONFLICT`; remover o papel do último gestor ativo → `CONFLICT`; desativar a si mesmo → `CONFLICT`

### Implementation for User Story 6

- [x] T081 [P] [US6] Criar `lib/integrations/authAdmin.ts`: interface `AuthAdmin { inviteUser(email, redirectTo), deleteUser(id), setBanned(id, banned) }` + implementação com `lib/supabase/admin.ts` (`inviteUserByEmail`, `deleteUser`, `updateUserById({ ban_duration: '876000h' | 'none' })`)
- [x] T082 [P] [US6] Criar `lib/validation/member.ts`: `name` trim 2–80, `email` formato e-mail em minúsculas, `role` `'vendedor'|'gestor'`
- [x] T083 [US6] Adicionar `insertWithAdmin`, `updateRole`, `setActive` e `countActiveGestores` em `lib/supabase/repositories/profiles.ts` (insert pelo client admin, porque `profiles` não tem policy de insert)
- [x] T084 [US6] Implementar `lib/services/members/manageMembers.ts`: `inviteMember` (com `redirectTo = ${SITE_URL}/auth/confirm`), `updateMemberRole`, `setMemberActive` (ban/unban + `profiles.active`), com as regras testadas em T080
- [x] T085 [US6] Criar `app/actions/members.ts` (`inviteMember`, `updateMemberRole`, `setMemberActive`; `requireGestor` antes do serviço; revalida `/settings/members`)
- [x] T086 [P] [US6] Criar `components/settings/MembersTable.tsx` (nome, e-mail, papel editável, ativo/inativo com confirmação) e `components/settings/InviteMemberForm.tsx` (client)
- [x] T087 [US6] Criar `app/(crm)/settings/members/page.tsx`: vendedor → `notFound()`; compõe `InviteMemberForm` + `MembersTable`
- [x] T088 [US6] Criar `app/auth/confirm/route.ts` (GET): lê `token_hash` e `type` (`invite`), chama `verifyOtp` com o client de servidor (cria a sessão nos cookies) e redireciona para `/definir-senha`; token inválido/expirado → `/login?erro=convite` com a mensagem "Convite inválido ou expirado. Peça um novo ao gestor."
- [x] T089 [US6] Criar `app/(auth)/definir-senha/page.tsx` + `components/auth/SetPasswordForm.tsx` (client): senha (mín. 8 caracteres) + confirmação iguais, `auth.updateUser({ password })` e redireciona para `/`; sem sessão → `/login`
- [ ] T090 [US6] Garantir o bloqueio de inativos no login (complementa T024): conferir que o `ban_duration` de T081 faz o `signInWithPassword` falhar e que o `LoginForm` (T031) mostra a mensagem genérica; sessão já aberta de membro desativado cai no `getViewer` → `/login`

**Checkpoint**: todas as histórias P1 completas (MVP comercial desta feature).

---

## Phase 7: User Story 4 - Fechar e regras do funil (Priority: P2)

**Goal**: Ganho/Perdido/Stand-by com dados obrigatórios, gate "Qualificado" para outbound, reabertura com nova próxima ação e cancelamento sem efeito.

**Independent Test**: mover deals para Ganho, Perdido e Stand-by exige os dados certos; cancelar devolve o card; outbound não qualificado é bloqueado antes de "Diagnóstico agendado"; reabrir exige próxima ação.

### Tests for User Story 4 (escrever primeiro e ver falhar)

- [x] T091 [P] [US4] Testes de `validateTransition` em `tests/unit/services/transitions.test.ts` cobrindo US4-1 a US4-6: Ganho sem `dealType` → `WON_DATA_REQUIRED`; recorrente com `mrr` 0 ou ausente → `WON_DATA_REQUIRED`; Perdido sem motivo ou com motivo fora de `preço|timing|concorrente|sem_budget|sumiu|outro` → `LOST_REASON_REQUIRED`; Stand-by com `reaquecerEm <= today` → `STANDBY_DATE_REQUIRED`; outbound sem `qualified_at` para `kind='open'` com `position >= position(diagnostico_agendado)` ou para `kind='won'` → `QUALIFICATION_REQUIRED`; outbound não qualificado para Perdido/Stand-by → permitido; inbound sem `qualified_at` → permitido; reabrir (`won|lost|standby` → `open`) sem próxima ação → `NEXT_ACTION_REQUIRED`
- [x] T092 [P] [US4] Testes de `closeDeal`/`reopenDeal` em `tests/unit/services/closeDeal.test.ts`: status resultante = `stage.kind`; reabrir limpa `lost_reason` e `reaquecer_em` e grava `stage_change` + `next_action_change`; `deleteDeal` de não-gestor → `FORBIDDEN`

### Implementation for User Story 4

- [x] T093 [US4] Implementar `lib/services/deals/transitions.ts`: função pura `validateTransition({ deal, contactOrigem, fromStage, toStage, stages, today, input })`, que lança `DomainError` com `code` e `field`. É a **fonte única** das regras de fechamento e do gate (princípio V)
- [x] T094 [P] [US4] Criar `lib/validation/closeDeal.ts`: `won: { dealType: 'pontual'|'recorrente', mrr?: number > 0 (obrigatório se recorrente) }`, `lost: { reason: 'preço'|'timing'|'concorrente'|'sem_budget'|'sumiu'|'outro' }` (rótulos da UI: preço, timing, concorrente, sem budget, sumiu, outro), `standby: { reaquecerEm: YYYY-MM-DD }`
- [x] T095 [US4] Implementar `lib/services/deals/closeDeal.ts` (valida → **uma** chamada `deals.move(..., { status, deal_type, mrr | lost_reason | reaquecer_em })` → `stage_change`) e `lib/services/deals/reopenDeal.ts` (valida → **uma** chamada `deals.move(..., { status: 'open', lost_reason: null, reaquecer_em: null, next_action, next_action_date })` → `stage_change` + `next_action_change`). Nunca mover e gravar status em chamadas separadas
- [x] T096 [US4] Fazer `lib/services/deals/moveDeal.ts` chamar `validateTransition` para qualquer destino, devolvendo o código do dado faltante quando o destino for de desfecho ou reabertura
- [x] T097 [US4] Adicionar as actions `closeDeal`, `reopenDeal` e `deleteDeal` (`requireGestor`) em `app/actions/deals.ts`
- [x] T098 [P] [US4] Criar `components/deals/CloseDealDialog.tsx` (client): variantes Ganho (tipo pontual/recorrente; MRR aparece e é obrigatório se recorrente), Perdido (select de motivo) e Stand-by (data com `min` = amanhã); `onCancel` sem chamada ao servidor
- [x] T099 [P] [US4] Criar `components/deals/ReopenDealDialog.tsx` (client): próxima ação + data obrigatórias, chama `reopenDeal`
- [x] T100 [US4] Integrar em `components/pipeline/KanbanBoard.tsx`: soltar em etapa `kind<>'open'` abre o `CloseDealDialog`; soltar deal fechado em etapa `open` abre o `ReopenDealDialog`; cancelar faz rollback local (FR-020); erro `QUALIFICATION_REQUIRED` vira toast "Este deal precisa passar por Qualificado antes" + rollback
- [x] T101 [US4] Adicionar em `app/(crm)/deals/[id]/page.tsx` as ações "Marcar como ganho / perdido / stand-by", "Reabrir" e "Excluir deal" (só gestor, com confirmação), reaproveitando os diálogos; exibir `deal_type`/`mrr`, `lost_reason` ou `reaquecer_em` conforme o status

**Checkpoint**: regras de funil aplicadas no Kanban e na página do deal; `/hoje` já ignora deals não `open`.

---

## Phase 8: User Story 5 - Timeline do deal e do contato (Priority: P2)

**Goal**: histórico cronológico (notas, notas de call, mudanças de etapa e de próxima ação) no deal e no contato, com adição rápida de notas.

**Independent Test**: adicionar uma nota e uma nota de call a um deal, mover a etapa e ver os três eventos na timeline do deal e na do contato, com autor e data/hora.

### Tests for User Story 5

- [x] T102 [P] [US5] Testes em `tests/unit/services/activities.test.ts`: `addNote` com `dealId` preenche `contactId` do deal; `content` vazio ou com mais de 5000 caracteres → `VALIDATION`; `getTimeline({ contactId })` devolve as atividades do contato e dos seus deals, em `created_at desc`

### Implementation for User Story 5

- [x] T103 [P] [US5] Criar `lib/validation/note.ts`: `type` `'note'|'call_note'`, `content` trim 1–5000, `dealId` ou `contactId` (ao menos um, uuid)
- [x] T104 [US5] Adicionar `listByDeal(dealId)` e `listByContact(contactId)` (`contact_id = X`, `created_at desc`, com nome do autor) em `lib/supabase/repositories/activities.ts`
- [x] T105 [US5] Implementar `lib/services/activities/addNote.ts` e `lib/services/activities/getTimeline.ts`
- [x] T106 [US5] Criar a action `addNote` em `app/actions/activities.ts` (revalida `/deals/[id]` e `/contacts/[id]`)
- [x] T107 [P] [US5] Criar `components/contacts/ActivityTimeline.tsx` (server): ícone e rótulo pt-BR por tipo ("Nota", "Nota de call", "Mudou de etapa: A → B", "Próxima ação: X (dd/mm) → Y (dd/mm)"), autor e `formatDateTime`; tipos futuros (`transcript`, `analysis`, `email`, `proposal`) com rótulo genérico
- [x] T108 [P] [US5] Criar `components/contacts/NoteForm.tsx` (client): alternância Nota/Nota de call, textarea e envio com Ctrl+Enter
- [x] T109 [US5] Integrar `NoteForm` + `ActivityTimeline` em `app/(crm)/deals/[id]/page.tsx` e `app/(crm)/contacts/[id]/page.tsx` (FR-027–FR-029)

**Checkpoint**: timeline completa; todas as histórias P1 e P2 funcionando.

---

## Phase 9: User Story 7 - Gerenciar etapas do funil (Priority: P3)

**Goal**: o gestor cria, renomeia, reordena e altera probabilidade/cor das etapas, com as exclusões protegidas.

**Independent Test**: renomear uma etapa e mudar sua probabilidade reflete no Kanban para todos; excluir "Ganho" ou etapa com deals é bloqueado; vendedor não acessa.

### Tests for User Story 7

- [x] T110 [P] [US7] Testes de `manageStages` em `tests/unit/services/manageStages.test.ts`: `probability` fora de 0–100 → `VALIDATION`; não-gestor → `FORBIDDEN`; excluir etapa com deals, `kind<>'open'` ou com `key` → `STAGE_NOT_DELETABLE`; `reorderStages` que coloca etapa de desfecho antes de uma aberta → `VALIDATION`; `createStage` após X desloca as posições seguintes

### Implementation for User Story 7

- [x] T111 [P] [US7] Criar `lib/validation/stage.ts`: `name` trim 1–60, `probability` int 0–100, `color` hex `#RRGGBB`, `afterStageId` uuid
- [x] T112 [US7] Adicionar `insert`, `update`, `updatePositions(orderedIds)`, `delete` e `countDeals(stageId)` em `lib/supabase/repositories/stages.ts`
- [x] T113 [US7] Implementar `lib/services/stages/manageStages.ts` (`createStage` sempre com `kind='open'` e `key=null`, `updateStage`, `reorderStages`, `deleteStage`)
- [x] T114 [US7] Criar `app/actions/stages.ts` (`requireGestor`; revalida `/pipeline` e `/settings/stages`)
- [x] T115 [P] [US7] Criar `components/settings/StagesEditor.tsx` (client): lista ordenável (botões ↑/↓), edição inline de nome, probabilidade e cor, "Adicionar etapa após…" e excluir (desabilitado para as de desfecho/sistema, com tooltip explicando o motivo)
- [x] T116 [US7] Criar `app/(crm)/settings/stages/page.tsx` (vendedor → `notFound()`) e um link para "Etapas" em Configurações na `Sidebar`

**Checkpoint**: todas as histórias completas.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: qualidade, segurança e validação final

- [x] T117 [P] Configurar o Playwright em `playwright.config.ts` (baseURL local, `.env.test` apontando para um branch/projeto Supabase de teste) e criar `tests/e2e/hoje.spec.ts`, `tests/e2e/kanban.spec.ts` e `tests/e2e/cadastro.spec.ts` cobrindo os cenários 1, 3–8 e 10–12 do quickstart (opcional, recomendado)
- [ ] T118 [P] Revisar o responsivo das telas em larguras de 375 px e 768 px (sidebar recolhível em `components/layout/Sidebar.tsx`; Kanban com rolagem horizontal) sem quebrar o layout
- [ ] T119 [P] Revisar a acessibilidade: labels em todos os campos, foco visível, diálogos com `aria`, atraso indicado também por texto (não só cor)
- [x] T120 Revisar os logs: nenhum `console.*` com e-mail, telefone ou conteúdo de nota; só `code` e ids (`lib/actions/result.ts` e serviços)
- [x] T121 Rodar `get_advisors` (security e performance) no projeto Supabase e corrigir os alertas (RLS, índices de FK faltando)
- [x] T122 Conferir que nenhum arquivo passa de ~300 linhas (`app/`, `components/`, `lib/`) e quebrar os que passarem
- [x] T123 Atualizar a seção "Comandos" de `CLAUDE.md` com os comandos reais (`npm run dev`, `lint`, `typecheck`, `test`, `test:e2e`, `db:types`, `supabase db push`)
- [ ] T124 Rodar `npm run lint`, `npm run typecheck` e `npm test` sem erros e executar os 19 cenários + a checagem de RLS de [quickstart.md](./quickstart.md)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências.
- **Foundational (Phase 2)**: depende do Setup. **T009 (aprovação humana do schema) bloqueia T010–T015**; T016–T022 e T025–T030 podem andar em paralelo com o gate, porque não dependem do schema final (exceto os tipos de T015, que só os repositórios precisam para compilar).
- **User Stories (Phase 3+)**: todas dependem da Phase 2.
- **Polish (Phase 10)**: depende das histórias desejadas.

### User Story Dependencies

- **US1 Hoje (P1)**: só Phase 2; testável com `seed.dev.sql`.
- **US2 Kanban (P1)**: só Phase 2; reutiliza `NextActionBadge` (T044). Se US1 não estiver pronta, criar o badge antes.
- **US3 Cadastro (P1)**: só Phase 2; a página `/deals/[id]` usa `NextActionForm` (T045).
- **US6 Membros (P1)**: só Phase 2 (login/logout já estão lá); `OwnerSelect` (T073) aproveita os membros convidados aqui, mas funciona sem eles.
- **US4 Fechamento (P2)**: depende de US2 (`moveDeal`, `KanbanBoard`) e de US3 (`/deals/[id]`).
- **US5 Timeline (P2)**: depende de US3 (páginas de deal e contato); os eventos vêm de US1/US2/US4.
- **US7 Etapas (P3)**: só Phase 2; o efeito visível aparece no Kanban (US2).

### Within Each User Story

- Testes de serviço antes do serviço (US4: obrigatoriamente vê-los falhar primeiro).
- Validação/repositório → serviço → action → componentes → página.

### Parallel Opportunities

- Setup: T003–T008.
- Foundational: T016–T022 e T025–T030 (arquivos distintos).
- Depois da Phase 2: US1, US2, US3, US6 e US7 podem andar em paralelo (em times diferentes); US4 e US5 esperam US2/US3.
- Dentro das histórias: todas as tarefas `[P]` (validação, repositórios, componentes isolados e testes).

---

## Parallel Example: User Story 1

```text
# Testes em paralelo:
Task: "T036 Testes de lib/dates.ts em tests/unit/lib/dates.test.ts"
Task: "T037 Testes de getTodayList em tests/unit/services/getTodayList.test.ts"
Task: "T038 Testes de setNextAction em tests/unit/services/setNextAction.test.ts"

# Peças de UI independentes em paralelo:
Task: "T044 NextActionBadge em components/deals/NextActionBadge.tsx"
Task: "T045 NextActionForm em components/deals/NextActionForm.tsx"
Task: "T047 OwnerFilter em components/today/OwnerFilter.tsx"
```

## Parallel Example: User Story 3

```text
Task: "T063 lib/validation/company.ts"
Task: "T064 lib/validation/contact.ts"
Task: "T065 lib/validation/deal.ts"
Task: "T066 lib/supabase/repositories/companies.ts"
Task: "T067 lib/supabase/repositories/contacts.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 (Setup) e Phase 2 (Foundational), **incluindo a aprovação do schema em T009**.
2. Phase 3 (US1 "Hoje") com `seed.dev.sql`.
3. **Parar e validar**: cenários 6–9 do quickstart.

### Incremental Delivery

1. Setup + Foundational → login e schema prontos.
2. US1 "Hoje" → valida o motor diário.
3. US2 Kanban + US3 Cadastro → o time já opera o funil pela UI (primeiro uso real).
4. US6 Membros → o gestor monta o time sem precisar do dashboard do Supabase.
5. US4 Fechamento + US5 Timeline → dados completos para forecast/KPIs das próximas features.
6. US7 Etapas → refinamento.
7. Polish → quickstart completo.

---

## Notes

- `[P]` = arquivos diferentes, sem dependência pendente.
- Mudança de schema fora de T010–T013 exige nova migration (`supabase/migrations/<timestamp>_<nome>.sql`) e um novo gate humano.
- Commit por tarefa ou grupo lógico (quando o repositório git for inicializado).
- Parar em qualquer checkpoint para validar a história sozinha.

## Notas de implementação (2026-10-01)

- **Pendentes (precisam de ação humana ou do app rodando com usuários):** T035 (primeiro gestor e configurações do Supabase Auth), T090 (conferir na prática o bloqueio de membro inativo), T118/T119 (revisão visual de responsivo e acessibilidade no navegador) e T124 (os 19 cenários do quickstart). Lint, typecheck, `npm test` (66 testes) e `next build` passam.
- **Migrations:** aplicadas pelo MCP do Supabase (a `DATABASE_URL` estava vazia). Os arquivos locais usam as versões gravadas no remoto (`20261001011348_init` … `20261001011444_activities_policy_initplan`). Duas migrations extras saíram do advisor: `private_helpers` (move `is_gestor`/`is_active_member` para o schema `private`, fora da API) e `activities_policy_initplan` (`(select auth.uid())` na policy).
- **Desvios de caminho, sem mudança de comportamento:** `OwnerFilter` ficou em `components/common/` (usado em "Hoje" e no Kanban); o contador de "Hoje" é calculado no layout e mostrado no `NavLink` (sem `TodayCounter` separado); `closeDeal` foi validado em `lib/validation/deal.ts`; os serviços de contatos, empresas e atividades ficaram agrupados em um arquivo por domínio; o insert de perfil pelo admin está em `lib/integrations/authAdmin.ts` (`insertProfile`).
- **Busca do Kanban:** o filtro `q` roda no serviço `getBoard` (sem acento, título/contato/empresa) sobre os deals do dono filtrado, em vez de `ilike` no repositório; com filtro ativo, o índice do arraste usa a posição real do vizinho visível (`lib/pipeline/boardState.ts`).
- **Validação do banco não executada:** o teste transacional de `move_deal`, constraints e RLS por papel (com rollback) foi recusado na sessão; vale rodar antes do uso real.
