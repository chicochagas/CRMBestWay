<!--
Sync Impact Report
- Version change: (template, unversioned) → 1.0.0
- Modified principles: all template placeholders replaced (initial ratification)
  - [PRINCIPLE_1_NAME] → I. Venda Primeiro (Escopo Guiado por Resultado)
  - [PRINCIPLE_2_NAME] → II. Arquitetura em Camadas e Integrações Isoladas
  - [PRINCIPLE_3_NAME] → III. Gatilhos Finos e Idempotentes
  - [PRINCIPLE_4_NAME] → IV. Segurança e Privacidade (INEGOCIÁVEL)
  - [PRINCIPLE_5_NAME] → V. Regra de Negócio em Fonte Única, Testada
  - added → VI. Usabilidade é Requisito Comercial
- Added sections: Restrições Técnicas e de Design; Fluxo de Desenvolvimento
- Removed sections: none
- Source: .llm/prd.md (PRD v2, Partes 1–3)
- Templates: .specify/templates/* read the constitution at runtime; no edits made (out of scope)
- Deferred TODOs: none
-->

# CRM RedRex Constitution

## Core Principles

### I. Venda Primeiro (Escopo Guiado por Resultado)

O objetivo do produto é aumentar as vendas da RedRex, não "ter um sistema".

- Toda feature MUST servir a pelo menos uma das três perguntas: _o que eu faço hoje?_
  (vendedor), _quanto vamos fechar este mês?_ (gestor), _o que funciona pra vender?_ (método).
  Se não serve a nenhuma, fica fora.
- Itens marcados como "Fora do MVP" no PRD (§5) MUST NOT entrar numa spec do MVP sem emenda
  explícita do PRD.
- `.llm/prd.md` é a fonte de verdade de produto; specs MUST referenciar os RFs (RF1–RF13) que
  atendem.

**Racional:** CRM que não aumenta venda é custo; o filtro evita escopo decorativo.

### II. Arquitetura em Camadas e Integrações Isoladas

- Apresentação: páginas apenas compõem; componentes fazem uma coisa. Arquivo acima de ~300
  linhas MUST ser quebrado.
- Aplicação: regra de negócio MUST viver em `lib/services/`. Rotas, sync, webhooks e UI só
  chamam serviços.
- Dados: acesso ao banco MUST passar pelos repositórios em `lib/supabase/`.
- Integrações: cada provedor externo (Calendly, tl;dv, Anthropic, Gmail, WhatsApp) MUST ficar
  atrás de um adapter com interface em `lib/integrations/` (ou `lib/whatsapp.ts`).
- Runtime do app (código determinístico) e IA em runtime (chamadas à API da Anthropic) são
  camadas distintas. Subagentes do Claude Code (`.claude/agents/`) são ferramentas de dev/uso
  manual e MUST NOT fazer parte do caminho de produção.

**Racional:** trocar Calendly, tl;dv ou o modelo de IA deve exigir mudança em um único lugar.

### III. Gatilhos Finos e Idempotentes

- Rotas de sync e webhooks MUST: autenticar/verificar, validar o payload (ex.: `zod`),
  deduplicar, delegar ao serviço e responder rápido; processamento pesado roda async.
- A deduplicação do Calendly MUST usar o UUID do evento (`deals.calendly_event_uid`), nunca o
  título. O título/tipo de evento apenas filtra quais eventos puxar.
- A deduplicação do tl;dv MUST usar o `meetingId`.
- Polling e webhook do Calendly MUST chamar o mesmo serviço (`createDealFromBooking`); só o
  gatilho muda.
- Falha de IA MUST ser capturada e registrada sem travar o pipeline nem o deal.

**Racional:** integrações de terceiros reentregam, atrasam e paginam; repetir uma chamada não
pode duplicar contato, deal ou atividade.

### IV. Segurança e Privacidade (INEGOCIÁVEL)

- RLS MUST estar habilitado em todas as tabelas. A `service role key` do Supabase só em rotas
  de servidor.
- Segredos MUST ficar só no servidor: nunca em `NEXT_PUBLIC_*`, nunca commitados, inclusive o
  token do Calendly. Config validada de forma tipada em `lib/env.ts`, falhando cedo.
- A rota de sync MUST exigir sessão Supabase ou `CRON_SECRET`. Webhooks MUST verificar
  assinatura/segredo (HMAC com comparação em tempo constante) antes de processar; sem
  verificação → `401`. Rotas públicas MUST ter rate limiting.
- Transcripts e propostas são dados sensíveis (LGPD): consentimento de gravação, retenção
  definida, acesso por RLS, logs estruturados sem PII, e envio à API da Anthropic apenas do
  necessário. A API MUST ter limite de gasto configurado.
- E-mail no MVP é apenas rascunho (revisão humana obrigatória); nenhum envio automático.

**Racional:** sync e webhooks são a maior superfície de ataque, e os dados tratados são de
clientes.

### V. Regra de Negócio em Fonte Única, Testada

- O forecast MUST ser calculado apenas em `computeForecast` (`value × stage.probability / 100`
  sobre deals `open`); nenhuma outra parte do código reimplementa a regra.
- Regras de fechamento MUST ser aplicadas no serviço: "Ganho" exige `deal_type` (+ `mrr` se
  recorrente); "Perdido" exige `lost_reason` padronizado; "Stand-by" exige `reaquecer_em`.
  Deal outbound MUST passar por "Qualificado" antes de "Diagnóstico agendado".
- Serviços com regra de negócio (forecast, preenchimento de template, booking, análise) MUST
  ter testes de unidade. O parsing de payloads do Calendly e do tl;dv MUST ter testes de
  contrato.
- Mudanças de schema MUST ser feitas por migrations versionadas.

**Racional:** se a regra se espalha ou os dados de deal ficam incompletos, o forecast mente e
os KPIs perdem valor.

### VI. Usabilidade é Requisito Comercial

- O caminho "abrir CRM → ver o que fazer hoje → agir (WhatsApp/e-mail) → atualizar deal" MUST
  levar poucos cliques.
- Todo deal em aberto MUST ter `next_action` + `next_action_date`; a tela "Hoje" lista os
  follow-ups de hoje e atrasados do vendedor logado.
- Server Components por padrão; Client Components só onde há interatividade (drag-and-drop,
  botão _Atualizar_, formulários).

**Racional:** vendedor não usa CRM difícil, e se o `next_action` não é atualizado o forecast
fica errado.

## Restrições Técnicas e de Design

- **Stack:** Next.js (App Router) + TypeScript em todo o código; Tailwind CSS + shadcn/ui;
  Supabase (Postgres + Auth + RLS); deploy na Vercel (Cron para o polling, intervalo de
  5–15 min).
- **Integrações:** Calendly API v2 via polling (plano Free; webhook `invitee.created` é upgrade
  opcional); tl;dv webhooks `MeetingReady`/`TranscriptReady`; API Messages da Anthropic;
  Gmail (rascunho); WhatsApp via link `wa.me` (sem API).
- **Convenções:** `camelCase` para variáveis, `PascalCase` para componentes e tipos.
- **Design:** tema claro executivo conforme `.llm/crm.png` e PRD §14: fundo `#F6F4EF`, cards
  `#FFFFFF`, borda `#E7E3DB`, primário `#18181B`, accent `#4D7C0F`, lime `#A3E635`, raio de
  card 16px, sidebar à esquerda. Vermelho `#DC2626` reservado para atraso/erro.
- **Modelo de dados:** o schema de referência é o Apêndice A do PRD; desvios exigem emenda.

## Fluxo de Desenvolvimento

- Spec e plano antes de código (`/speckit-specify` → `/speckit-plan` → `/speckit-tasks` →
  `/speckit-implement`). Todo plano MUST passar pelo Constitution Check contra estes princípios.
- Implementação incremental: um componente por vez, arquivos pequenos.
- Mudanças de arquitetura ou de schema MUST ter o diff mostrado e aguardar revisão humana antes
  de seguir. A IA executa; a decisão de arquitetura é humana. Em dúvida de design, parar e
  perguntar.
- Lint e checagem de tipos MUST passar antes de uma tarefa ser considerada pronta.

## Governance

- Esta constituição prevalece sobre outras práticas do projeto. Em conflito com o PRD sobre
  regras de engenharia, ambos MUST ser reconciliados por emenda.
- Emendas: proposta por escrito, aprovação do gestor do produto, atualização deste arquivo com
  Sync Impact Report e, se aplicável, plano de migração.
- Versionamento semântico: MAJOR para remoção/redefinição incompatível de princípio; MINOR para
  princípio ou seção nova ou guidance materialmente ampliada; PATCH para clarificações.
- Toda spec, plano e revisão MUST verificar conformidade; complexidade que viole um princípio
  MUST ser justificada no plano (Complexity Tracking). Guidance de runtime para agentes fica em
  `CLAUDE.md`.

**Version**: 1.0.0 | **Ratified**: 2026-09-30 | **Last Amended**: 2026-09-30
