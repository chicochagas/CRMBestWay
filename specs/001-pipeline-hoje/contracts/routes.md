# Contrato: rotas de UI, acesso e RPC do banco

## Rotas de UI

Toda rota fora de `/login`, `/auth/confirm` e `/definir-senha` exige sessão de um membro ativo. `proxy.ts` redireciona para
`/login?next=<rota>` (FR-001).

| Rota | Conteúdo | Parâmetros de URL | Acesso |
|---|---|---|---|
| `/login` | formulário e-mail + senha (login no client, rate limit do Supabase Auth) | `next` | público |
| `/auth/confirm` | route handler: `verifyOtp({ token_hash, type })` do convite → redireciona para `/definir-senha` | `token_hash`, `type` | público |
| `/definir-senha` | convidado define a senha (`auth.updateUser`) e entra no CRM | — | sessão criada pelo convite |
| `/` | redireciona para `/pipeline` (até existir o dashboard) | — | membro |
| `/hoje` | lista "Hoje": atrasados (dias de atraso) e depois os de hoje; concluir/reagendar inline; estado vazio "Você está em dia" | `owner=me\|<uuid>\|team` (≠ `me` só para gestor; vendedor recebe sempre `me`) | membro |
| `/pipeline` | Kanban: colunas com nome, probabilidade, contagem e soma; cards com título, contato/empresa, dono, valor, próxima ação (vermelho `#DC2626` se atrasada) | `owner=<uuid>\|all`, `q=<texto>` | membro |
| `/deals/[id]` | dados do deal, edição, próxima ação, fechamento, timeline | — | membro |
| `/contacts` | busca de contatos e empresas; botão "Novo lead" | `q` | membro |
| `/contacts/[id]` | contato, deals do contato, timeline combinada (FR-028), nova nota | — | membro |
| `/companies/[id]` | empresa e seus contatos | — | membro |
| `/settings/members` | membros: convidar, papel, ativar/desativar | — | gestor (vendedor → 404) |
| `/settings/stages` | etapas: criar, renomear, probabilidade, cor, ordem, excluir | — | gestor (vendedor → 404) |

A sidebar (`app/(crm)/layout.tsx`) mostra Hoje (com contador de pendentes, FR-026), Pipeline,
Contatos, Configurações (só gestor), nome e papel do usuário e o botão Sair.

## Leituras (serviços chamados por Server Components)

| Serviço | Assinatura | Ordenação / regra |
|---|---|---|
| `getTodayList` | `(viewer, { owner, today }) → TodayItem[]` | `status='open' and next_action_date <= today`; `next_action_date asc, updated_at asc`; `daysOverdue = today − date` |
| `countToday` | `(viewer, today) → number` | mesmo filtro, só do próprio usuário |
| `getBoard` | `({ owner?, q? }) → { stages: Column[] }` | etapas por `position`; deals por `position`; totais calculados sobre os deals filtrados |
| `getDeal` | `(id) → DealDetail` | inclui contato, empresa, dono e etapa |
| `getTimeline` | `({ dealId } \| { contactId }) → Activity[]` | `created_at desc`; contato = `contact_id = X` (inclui as atividades dos seus deals) |
| `searchContacts` / `searchCompanies` | `(q) → […]` | `ilike` em nome/e-mail/empresa, limite 50 |

```ts
type TodayItem = {
  dealId: string; title: string; value: number;
  stage: { id: string; name: string };
  contact: { id: string; name: string; email: string; phone: string | null };
  owner: { id: string; name: string } | null;
  nextAction: string; nextActionDate: string; // YYYY-MM-DD
  daysOverdue: number;                         // 0 = vence hoje
};
```

## RPC do banco

### `public.move_deal(p_deal_id uuid, p_stage_id uuid, p_index int, p_patch jsonb default '{}'::jsonb) returns void`

- `security invoker` (respeita RLS), executa em transação única.
- Remove o deal da coluna de origem, insere na coluna de destino na posição `p_index`
  (limitada a `[0, n]`) e renumera as duas colunas como `0..n-1`. Atualiza `stage_id`.
- Na mesma transação, aplica `p_patch` sobre o deal, aceitando só as chaves `status`,
  `deal_type`, `mrr`, `lost_reason`, `reaquecer_em`, `next_action`, `next_action_date` e
  `qualified_at`; chave desconhecida → exceção. As constraints de `deals` valem no commit.
- **Não** valida regras de negócio. Quem chama é só o repositório `deals.move()`, depois de
  `validateTransition` no serviço.

### `private.is_gestor()` / `private.is_active_member()`

Funções `stable security definer` usadas pelas policies de RLS (ver
[data-model.md](../data-model.md#deltas-em-relação-ao-apêndice-a)).

## Variáveis de ambiente (validadas em `lib/env.ts`)

| Variável | Onde | Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + servidor | URL do projeto |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | client + servidor | chave publicável (RLS se aplica) |
| `SUPABASE_SECRET_KEY` | **só servidor** (`server-only`) | convite e desativação de membros (Auth admin) |
| `SITE_URL` | **só servidor** | base do link de convite (`${SITE_URL}/auth/confirm`) |
| `DATABASE_URL` | só CLI/local | aplicar migrations (`supabase db push`); não é lida pelo app |
