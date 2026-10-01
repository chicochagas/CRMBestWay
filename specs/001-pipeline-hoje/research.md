# Research: Pipeline comercial com próxima ação e tela "Hoje"

Fase 0 do [plan.md](./plan.md). Não restaram itens `NEEDS CLARIFICATION`: a stack vem da
constituição, e as escolhas abaixo resolvem os pontos que a spec deixou abertos.

## R1. Versões da stack

- **Decision**: Next.js 16.3, React 19.3, Tailwind CSS 4.3, zod 4, `@supabase/ssr` 0.12,
  `@supabase/supabase-js` 2.117, Node.js 24 (versões estáveis em 2026-09-30).
- **Rationale**: a constituição fixa a stack; usar as versões correntes evita migração logo
  no início. Duas consequências: no Next 16, o `middleware.ts` virou `proxy.ts`; no Tailwind 4,
  os tokens de design ficam no CSS (`@theme` em `app/globals.css`), e não num
  `tailwind.config.ts` como sugere o PRD §14.
- **Alternatives considered**: fixar Next 15 / Tailwind 3 para seguir o texto do PRD. Rejeitado:
  mesma semântica, só que defasado.

## R2. Escrita: Server Actions vs rotas de API

- **Decision**: Server Actions em `app/actions/*`, cada uma no formato: obter sessão → validar com
  zod → chamar serviço → `revalidatePath`, retornando `ActionResult<T>` tipado.
- **Rationale**: não há consumidor externo nesta feature; Server Actions eliminam a camada HTTP
  manual e mantêm o padrão "gatilho fino" do princípio III.
- **Alternatives considered**: rotas `app/api/*` REST. Ficam para sync/webhooks, que têm
  chamadores externos.

## R3. Autenticação e membros

- **Decision**: Supabase Auth com e-mail + senha via `@supabase/ssr` (cookies). **O login roda no
  client** (`createBrowserClient().auth.signInWithPassword`), direto contra o Supabase Auth, para
  herdar o rate limit nativo por IP do usuário (constituição §IV: rotas públicas com rate limiting).
  Uma Server Action concentraria todas as tentativas no IP do servidor e anularia esse limite. Os
  limites ficam conferidos em Authentication → Rate Limits. `proxy.ts` renova a sessão e
  redireciona para `/login` quando não há usuário. O gestor convida membros com
  `auth.admin.inviteUserByEmail` (secret key, só em `lib/supabase/admin.ts` com `server-only`) e o
  serviço cria o `profile` na mesma operação. Cadastro público desligado no projeto Supabase.
  Desativar = `profiles.active = false` + banimento do usuário no Auth (`ban_duration`).
- **Rationale**: atende FR-001–FR-004 sem cadastro público; o banimento corta sessões
  existentes, e `active` preserva autoria e dono dos deals.
- **Alternatives considered**: magic link (ainda não decidido no PRD; a spec assume senha);
  trigger `on auth.users insert` criando o profile (esconde regra no banco e não recebe nome/papel).
- **Aceite do convite**: o link do e-mail aponta para `/auth/confirm?token_hash=…&type=invite`
  (route handler com `verifyOtp`, que cria a sessão) e redireciona para `/definir-senha`
  (`auth.updateUser({ password })`). As duas rotas ficam liberadas no `proxy.ts`. O template de
  e-mail "Invite user" do Supabase precisa usar
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite`.
- **Primeiro gestor**: provisionado manualmente (convite pelo dashboard + `insert` em `profiles`
  com `role='gestor'`), descrito no [quickstart.md](./quickstart.md).

## R4. Status do deal × etapa

- **Decision**: cada etapa tem `kind` (`open | won | lost | standby`). O `deals.status` é
  derivado da etapa de destino pelo serviço `moveDeal`/`closeDeal`. As etapas-chave do funil
  recebem `key` estável (`novo_lead`, `qualificado`, `diagnostico_agendado`, `ganho`, `perdido`,
  `standby`) para as regras não dependerem do nome.
- **Rationale**: a spec permite renomear etapas (US7), mas as regras de fechamento e o gate
  "Qualificado" precisam continuar valendo.
- **Alternatives considered**: comparar por nome (quebra ao renomear); flags booleanas
  separadas (mais colunas, mesma informação).

## R5. Gate "Qualificado" (FR-019)

- **Decision**: `deals.qualified_at` é preenchido na primeira vez que o deal entra na etapa
  `key='qualificado'` (ou em qualquer etapa aberta posterior, se o contato for inbound). Para
  contato `outbound` com `qualified_at` nulo, o serviço bloqueia o destino quando a etapa é
  `kind='open'` com `position >= position(diagnostico_agendado)`, ou quando é `kind='won'`.
  Mover para Perdido ou Stand-by é sempre permitido.
- **Rationale**: "nunca esteve em Qualificado" vira uma checagem O(1); perder um lead ainda não
  qualificado é um caso legítimo.
- **Alternatives considered**: consultar a timeline (`stage_change`) a cada movimento.

## R6. Kanban: ordenação e concorrência

- **Decision**: `position int` por coluna, reescrito atomicamente pela função SQL
  `move_deal(deal_id, stage_id, index, patch)` (`security invoker`, respeita RLS). As validações
  de negócio rodam antes, no serviço; a função renumera as colunas **e** aplica, na mesma
  transação, os campos de fechamento/reabertura do `patch` (whitelist). Assim, um deal nunca fica
  numa coluna de desfecho com `status` incoerente (SC-004/SC-006). O client usa `@dnd-kit/sortable` com
  atualização otimista e rollback + toast em erro. Regra de concorrência: vale a última gravação.
- **Rationale**: SC-006 exige zero perda de ordem; supabase-js não tem transação entre
  chamadas.
- **Alternatives considered**: indexação fracionária (`float`/lexorank) sem renumerar, que mudaria
  o tipo da coluna do Apêndice A e precisaria de rebalanceamento; `react-beautiful-dnd`, que está
  descontinuado.

## R7. "Hoje" e fuso horário

- **Decision**: `lib/dates.ts` calcula a data de hoje em `America/Sao_Paulo` com
  `Intl.DateTimeFormat` e a passa como parâmetro (`today`) ao serviço. A consulta usa
  `status='open' and next_action_date <= today`, ordenando por `next_action_date asc` e
  `updated_at asc`. Os dias de atraso são `today - next_action_date`. Gestor: filtro `owner`
  (`me` | id | `team`); o filtro `team` inclui deals sem dono.
- **Rationale**: `next_action_date` é `date` (sem hora), e o servidor da Vercel roda em UTC; sem
  fixar o fuso, entre 21h e 0h o "hoje" sairia errado.
- **Alternatives considered**: `now() at time zone` no SQL (espalha a regra entre camadas).

## R8. Regras de fechamento: onde vivem

- **Decision**: fonte única em `lib/services/deals/transitions.ts` (funções puras:
  `validateTransition(deal, from, to, input)`), com testes de unidade cobrindo todos os
  cenários da US4. No banco ficam `check constraints` equivalentes como rede de segurança.
  As mensagens de erro saem do serviço (`DomainError` com `code` e `field`).
- **Rationale**: atende o princípio V (fonte única e testada) e SC-003/SC-004 (100%).
- **Alternatives considered**: só constraints, que dão mensagens ruins e regra escondida; só
  serviço, sem garantia se alguém escrever direto na base.

## R9. Testes

- **Decision**: Vitest para serviços (repositórios injetados por interface → fakes em memória);
  Playwright E2E para os 4 fluxos P1 contra um branch/projeto Supabase de teste. Lint com ESLint
  (config do Next) e `tsc --noEmit` no CI local.
- **Rationale**: as regras de negócio estão em funções puras e testáveis; o E2E prova RLS + UI.
- **Alternatives considered**: testes de integração contra Supabase local (`supabase start`), que
  exigem Docker no Windows. Ficam como opção, sem obrigatoriedade.

## R10. Busca

- **Decision**: `ilike` em `contacts.name`, `contacts.email` e `companies.name` (e `deals.title` no
  Kanban), com debounce de 300 ms no client.
- **Rationale**: o volume é de milhares de registros, então full-text/trigram é desnecessário no MVP.
- **Alternatives considered**: `pg_trgm` + índice GIN, para quando o volume justificar.
