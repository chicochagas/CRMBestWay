# Implementation Plan: Pipeline comercial com próxima ação e tela "Hoje"

**Branch**: `001-pipeline-hoje` | **Date**: 2026-09-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-pipeline-hoje/spec.md`

## Summary

Primeira feature do CRM RedRex (PRD RF1–RF5): login e perfis do time, cadastro de empresas,
contatos e deals, Kanban com dono e próxima ação, regras de fechamento do funil, timeline e a
tela "Hoje". Abordagem: app Next.js (App Router) único na raiz do repositório, Server Components
para leitura e Server Actions finas para escrita, que validam com zod e delegam a serviços em
`lib/services/`; o banco é acessado só por repositórios em `lib/supabase/`. O schema parte do
Apêndice A do PRD, com **7 deltas** necessários para a spec (ver [data-model.md](./data-model.md#deltas-em-relação-ao-apêndice-a)),
aprovados e incorporados ao PRD (emenda v2.2, 2026-09-30).

## Technical Context

**Language/Version**: TypeScript 5.x (strict) sobre Node.js 24 LTS

**Primary Dependencies**: Next.js 16 (App Router, Server Actions), React 19, Tailwind CSS 4 +
shadcn/ui, `@supabase/ssr` + `@supabase/supabase-js` 2, zod 4, `@dnd-kit/core` + `@dnd-kit/sortable`

**Storage**: Supabase Postgres (projeto `ciajeyaoqyjnozeewest`, hoje vazio), RLS em todas as
tabelas, migrations versionadas em `supabase/migrations/`

**Testing**: Vitest (unidade dos serviços com repositórios em memória), Playwright (E2E dos
fluxos P1 contra um projeto/branch de teste), `tsc --noEmit` + ESLint

**Target Platform**: Vercel (Node runtime); navegadores desktop modernos, sem quebrar em telas
menores

**Project Type**: Aplicação web full-stack (Next.js monolito)

**Performance Goals**: "Hoje" renderizada em < 5 s a partir do login (SC-001); mover card com
feedback otimista imediato e persistência < 1 s

**Constraints**: datas de "hoje"/"atrasado" em America/Sao_Paulo (FR-025); nenhum segredo no
client; arquivos < ~300 linhas; Server Components por padrão

**Scale/Scope**: time pequeno (≤ 15 membros), até alguns milhares de deals; ~8 telas
(login, Hoje, pipeline, deal, contato, empresas/contatos, membros, etapas)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Verificação | Status |
|---|---|---|
| I. Venda primeiro | Responde a _o que eu faço hoje?_ (Hoje, próxima ação) e prepara _quanto vamos fechar_ (dados de fechamento completos). Referencia RF1–RF5. Nada do §5 "Fora do MVP". | ✅ |
| II. Camadas | Páginas compõem; `lib/services/` (`moveDeal`, `closeDeal`, `getTodayList`, `createDeal`…); repositórios em `lib/supabase/`. Sem integrações externas nesta feature. | ✅ |
| III. Gatilhos finos | Sem sync/webhook nesta feature. Server Actions seguem o mesmo padrão: autenticar → zod → serviço → resposta. | ✅ (n/a parcial) |
| IV. Segurança | RLS em todas as tabelas, com restrições por papel (gestor) via `is_gestor()`. `SUPABASE_SECRET_KEY` só em `lib/supabase/admin.ts` (`server-only`), usado apenas para convidar membros. `lib/env.ts` valida e falha cedo. Sem PII nos logs. | ✅ |
| V. Fonte única, testada | Regras de fechamento e gate "Qualificado" só em `lib/services/deals/transitions.ts`, com testes de unidade. Constraints no banco são rede de segurança, não segunda fonte. Forecast não é calculado aqui (somas de coluna são totais, não ponderados). Schema via migration. | ✅ |
| VI. Usabilidade | "Hoje" na sidebar com contador; concluir + reagendar inline na própria lista; Client Components só em Kanban (DnD), formulários e diálogos. | ✅ |
| Restrições: modelo de dados | **Desvios do Apêndice A** (7 deltas) aprovados em 2026-09-30 e incorporados ao PRD (emenda v2.2). | ✅ Justificado em Complexity Tracking |
| Fluxo | Spec → plano → tasks. Diff de schema será mostrado antes de aplicar. | ✅ |

**Resultado do gate (pré-pesquisa)**: aprovado. A emenda do Apêndice A foi aprovada e aplicada (PRD v2.2).
**Re-check pós-design**: aprovado; o design não introduziu novas violações (ver Complexity Tracking).

## Project Structure

### Documentation (this feature)

```text
specs/001-pipeline-hoje/
├── plan.md              # Este arquivo
├── research.md          # Fase 0: decisões técnicas
├── data-model.md        # Fase 1: entidades, deltas de schema, transições
├── quickstart.md        # Fase 1: guia de validação
├── contracts/
│   ├── server-actions.md   # Contratos das Server Actions (entrada/saída/erros)
│   └── routes.md           # Rotas de UI, acesso por papel e RPC do banco
└── tasks.md             # Fase 2 (/speckit-tasks — não criado aqui)
```

### Source Code (repository root)

```text
app/
├── (auth)/login/page.tsx            # login no client (rate limit do Supabase Auth)
├── (auth)/definir-senha/page.tsx    # aceite do convite
├── auth/confirm/route.ts            # verifyOtp do link de convite
├── (crm)/
│   ├── layout.tsx                 # sidebar + contador de "Hoje"
│   ├── page.tsx                   # redireciona para /pipeline (até existir o dashboard)
│   ├── hoje/page.tsx
│   ├── pipeline/page.tsx
│   ├── deals/[id]/page.tsx
│   ├── contacts/page.tsx          # busca de contatos e empresas
│   ├── contacts/[id]/page.tsx
│   ├── companies/[id]/page.tsx
│   └── settings/{members,stages}/page.tsx   # só gestor
└── actions/                       # Server Actions finas (auth → zod → serviço)
    ├── deals.ts  contacts.ts  companies.ts  activities.ts  stages.ts  members.ts  auth.ts (só signOut)
components/
├── ui/                            # primitivos shadcn
├── layout/                        # Sidebar, UserMenu, TodayCounter
├── pipeline/                      # KanbanBoard, KanbanColumn, KanbanCard, PipelineFilters
├── deals/                         # DealForm, NextActionBadge, NextActionForm, CloseDealDialog
├── today/                         # TodayList, TodayItem, OwnerFilter
├── contacts/                      # ContactForm, CompanyForm, ActivityTimeline, NoteForm
└── settings/                      # MembersTable, InviteMemberForm, StagesEditor
lib/
├── env.ts                         # zod: valida variáveis, separa públicas de servidor
├── dates.ts                       # todayInSaoPaulo(), daysOverdue()
├── supabase/
│   ├── server.ts  browser.ts  admin.ts   # clientes (admin = server-only, secret key)
│   ├── types.ts                   # gerado por `supabase gen types`
│   └── repositories/{deals,contacts,companies,stages,activities,profiles}.ts
├── services/
│   ├── deals/{createDeal,updateDeal,moveDeal,closeDeal,reopenDeal,transitions}.ts
│   ├── today/getTodayList.ts
│   ├── activities/{addNote,getTimeline}.ts
│   ├── stages/manageStages.ts
│   ├── members/manageMembers.ts
│   └── errors.ts                  # DomainError tipado (código + campo)
└── validation/                    # schemas zod compartilhados por actions e forms
proxy.ts                           # Next 16 (ex-middleware): refresh de sessão + redirect p/ login
supabase/
├── config.toml                    # gerado por `supabase init`
├── migrations/
│   ├── 20261001011348_init.sql      # Apêndice A + deltas
│   ├── 20261001011359_rls.sql       # policies por papel
│   └── 20261001011421_move_deal.sql # movimento atômico (move + patch)
└── seed.sql                       # etapas padrão
tests/
├── unit/services/                 # Vitest
└── e2e/                           # Playwright: Hoje, Kanban, cadastro, fechamento
```

**Structure Decision**: monolito Next.js na raiz, seguindo a árvore do PRD §12. Escritas usam
Server Actions em `app/actions/` em vez de rotas `app/api/*`, porque não há consumidor externo
nesta feature; rotas de API ficam para sync e webhooks (features futuras). O schema fica em
`supabase/migrations/` (versionado, princípio V) em vez de um `schema.sql` solto.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Desvio do Apêndice A: `profiles.active` | FR-003 (desativar membro) e edge case de membro desativado ainda dono de deals | Apagar o usuário quebra a autoria/dono dos deals (`on delete cascade` em `profiles`) |
| Desvio: `stages.kind` + `stages.key` | Mapear etapa → `deals.status` e proteger Ganho/Perdido/Stand-by (FR-014) e o gate "Qualificado" (FR-019) mesmo se renomeadas | Identificar etapa pelo nome quebra ao renomear (US7) |
| Desvio: `deals.qualified_at` | FR-019 exige saber se o deal _já passou_ por Qualificado | Varrer a timeline a cada movimento é caro e frágil |
| Desvio: `activities.author_id` + tipos `stage_change`/`next_action_change` | FR-027 exige autor e eventos de etapa/próxima ação | `metadata` sem FK não garante autor nem permite filtrar |
| Desvio: RLS por papel (`is_gestor()`) | FR-003/FR-008/FR-014: só gestor gerencia membros, etapas e exclui deals | Checar só na UI/serviço deixa a API do Supabase aberta a qualquer autenticado |
| Desvio: constraints de fechamento e `probability 0..100` | SC-003/SC-004 (100%) como rede de segurança | Só serviço: qualquer escrita fora dele gera dado inválido |
| Função `move_deal` (RPC, com `p_patch`) | Mover/fechar/reabrir de forma atômica (FR-011, SC-004, SC-006) | N updates via REST não são transacionais e corrompem posições sob concorrência |
