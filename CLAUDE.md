# CLAUDE.md

Este arquivo orienta o Claude Code (claude.ai/code) ao trabalhar com o código deste repositório.

## Status do projeto

Feature `001-pipeline-hoje` (login, cadastro, Kanban, regras do funil, timeline e "Hoje") implementada; specs em `specs/001-pipeline-hoje/`. A fonte de verdade é o [.llm/prd.md](.llm/prd.md), que é ao mesmo tempo o PRD e a constituição do projeto: ele traz o `schema.sql` completo (Apêndice A) e as specs de implementação de cada integração (Apêndice B). Leia-o antes de desenhar qualquer coisa. O [.llm/crm.png](.llm/crm.png) é a referência visual da interface.

O produto é um CRM comercial interno da RedRex (consultoria de engenharia de dados e IA). Toda feature precisa responder "isso aumenta venda?". O teste do PRD: o CRM precisa responder sozinho a _o que eu faço hoje?_ (vendedor), _quanto vamos fechar este mês?_ (gestor) e _o que funciona pra vender?_ (método). Tudo o que está fora do escopo do MVP (PRD §5) fica fora.

## Fluxo de trabalho: Spec Kit

Este repositório usa o GitHub Spec Kit (integração com Claude, scripts PowerShell em `.specify/scripts/powershell/`). Fluxo: `/speckit-constitution` → `/speckit-specify` → `/speckit-clarify` (opcional) → `/speckit-plan` → `/speckit-tasks` → `/speckit-analyze` (opcional) → `/speckit-implement`.

- A constituição em `.specify/memory/constitution.md` (v1.0.0) foi derivada do PRD (Partes 1–3). Todo plano passa pelo Constitution Check contra ela.
- Spec/plano antes de código. Em mudanças de arquitetura ou de schema, pare e mostre o diff para revisão; a decisão de arquitetura é humana. Em dúvida de design, pergunte.
- Rode lint e checagem de tipos antes de considerar o trabalho pronto.

## Comandos

Stack: Next.js 16 (App Router, `proxy.ts` no lugar de middleware) + TypeScript, Tailwind 4 + shadcn/ui, Supabase (Postgres, Auth, RLS), deploy na Vercel. Leia `AGENTS.md`: o Next 16 tem docs locais em `node_modules/next/dist/docs/`.

- `npm run dev`: servidor local em http://localhost:3000
- `npm run lint` / `npm run typecheck`: precisam passar antes de qualquer tarefa ser dada como pronta
- `npm test`: testes de unidade (Vitest, `tests/unit/`); um arquivo: `npx vitest run tests/unit/services/transitions.test.ts`
- `npm run test:e2e`: Playwright (`tests/e2e/`); precisa de `E2E_VENDEDOR_EMAIL`/`E2E_VENDEDOR_PASSWORD` e `npx playwright install chromium`
- `npm run db:push`: aplica `supabase/migrations/` + `seed.sql` usando `DATABASE_URL` do `.env`
- `npm run db:types`: regenera `lib/supabase/types.ts` depois de mudar o schema

Migrations novas: `supabase/migrations/<timestamp>_<nome>.sql`, sempre com diff mostrado e aprovação humana antes de aplicar. Os helpers de RLS ficam no schema `private` (fora da API). `supabase/seed.dev.sql` cria dados de exemplo (só desenvolvimento).

Variáveis de ambiente: veja `.env.example`. `SUPABASE_SECRET_KEY` (ou a legada `SUPABASE_SERVICE_ROLE_KEY`) só no servidor, via `lib/env.server.ts`; `SITE_URL` é a base do link de convite.

## Arquitetura (planejada, PRD §10–12)

**Duas camadas, não misture:**
1. **Runtime do app:** a sincronização do Calendly e o webhook do tl;dv criam contatos, movem deals, gravam transcripts e marcam presença. Código de backend comum, sem IA decidindo.
2. **IA em runtime:** o backend chama a API Messages da Anthropic (análise pós-call, preenchimento de templates de playbook). Subagentes do Claude Code em `.claude/agents/` são só ferramentas de dev/uso manual e nunca fazem parte da produção.

**Camadas:** páginas só compõem componentes pequenos → regras de negócio ficam em `lib/services/` (`createDealFromBooking`, `analyzeTranscript`, `fillTemplate`, `computeForecast`) → acesso a dados em `lib/supabase/` (repositórios) → adapters de terceiros em `lib/integrations/{calendly,tldv,anthropic,gmail}.ts` e `lib/whatsapp.ts`, cada um atrás de uma interface, para que um provedor possa ser trocado em um único lugar.

**Invariantes principais:**
- **Gatilhos finos:** rotas de sync e webhooks validam (zod), deduplicam, delegam a um serviço e respondem rápido; o trabalho pesado roda de forma assíncrona.
- **O polling do Calendly e o webhook pago opcional chamam o mesmo `createDealFromBooking`**; só o gatilho muda.
- **Idempotência:** deduplique o Calendly pelo UUID do evento (`deals.calendly_event_uid`), nunca pelo título (o título/tipo de evento só filtra quais eventos puxar). Deduplique o tl;dv pelo `meetingId`. A marca d'água em `sync_state` é uma otimização, não a garantia de corretude.
- **A lógica de forecast vive só em `computeForecast`** (`value × stage.probability / 100` sobre deals em aberto). Nunca a reimplemente em outro lugar.
- Falhas de IA são capturadas e registradas; nunca podem travar o pipeline.
- E-mail é só rascunho (rascunho no Gmail, revisão humana). WhatsApp é click-to-send via `wa.me`, sem API.
- Regras de fechamento de deal: "Ganho" exige `deal_type` (+ `mrr` se recorrente), "Perdido" exige um `lost_reason` padronizado, "Stand-by" exige `reaquecer_em`. Deals outbound precisam passar por "Qualificado" antes de "Diagnóstico agendado".
- Quebre arquivos acima de ~300 linhas. Server Components por padrão; Client Components só para interatividade (drag-and-drop, botão de sync, formulários).
- Validação centralizada e tipada das variáveis de ambiente em `lib/env.ts` (falha cedo).

## Segurança (PRD Parte 3: requisitos, não sugestões)

- RLS em todas as tabelas. A `service role key` do Supabase é usada só em rotas de servidor.
- Todos os segredos ficam só no servidor: nunca em `NEXT_PUBLIC_*`, nunca commitados. Isso inclui o token do Calendly.
- A rota de sync é protegida por sessão do Supabase ou por `CRON_SECRET`. Webhooks (tl;dv e Calendly opcional) verificam a assinatura com comparação HMAC em tempo constante antes de processar e, caso contrário, retornam `401`.
- Transcripts e propostas são dados sensíveis (LGPD): minimize PII nos logs e envie à API da Anthropic só os dados necessários.

## Design

Tema claro executivo conforme o PRD §14 e o `crm.png`: fundo creme `#F6F4EF`, cards brancos, botões primários pretos `#18181B`, destaques em verde-limão `#4D7C0F` / `#A3E635`, raio de card de 16px, sidebar à esquerda. O vermelho `#DC2626` é reservado para atraso/erro. Depois do login, a primeira tela é a visão executiva (forecast × meta + KPIs + Kanban juntos); a tela "Hoje" continua acessível na sidebar. Até a feature do dashboard existir, `/` redireciona para `/pipeline`.
