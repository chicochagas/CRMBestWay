# Contrato: Server Actions

Todas as actions ficam em `app/actions/*.ts` (`'use server'`) e seguem o mesmo formato:

1. Obtêm o usuário da sessão (`lib/supabase/server.ts`). Sem sessão → `UNAUTHENTICATED`.
2. Validam a entrada com o schema zod de `lib/validation/`. Erro → `VALIDATION` com `fieldErrors`.
3. Chamam **um** serviço de `lib/services/`. Erro de domínio → `DomainError` repassado.
4. Chamam `revalidatePath` das telas afetadas e devolvem `ActionResult<T>`.

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: ErrorCode; message: string; fieldErrors?: Record<string, string> };

type ErrorCode =
  | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'VALIDATION' | 'NOT_FOUND' | 'CONFLICT'
  | 'NEXT_ACTION_REQUIRED' | 'WON_DATA_REQUIRED' | 'LOST_REASON_REQUIRED'
  | 'STANDBY_DATE_REQUIRED' | 'QUALIFICATION_REQUIRED'
  | 'CONTACT_EMAIL_TAKEN' | 'CONTACT_HAS_DEALS' | 'STAGE_NOT_DELETABLE';
```

As mensagens são em pt-BR e prontas para exibir. Datas trafegam como `YYYY-MM-DD` e valores
monetários como `number` (reais, 2 casas).

## Deals: `app/actions/deals.ts`

| Action | Entrada | Saída | Erros específicos | FR |
|---|---|---|---|---|
| `createDeal` | `{ contactId, title, value?, ownerId?, nextAction, nextActionDate }` | `{ id }` | `NEXT_ACTION_REQUIRED`, `NOT_FOUND` (contato) | FR-007, FR-015 |
| `updateDeal` | `{ id, title?, value?, ownerId?: string \| null }` | `{ id }` | `NOT_FOUND` | FR-007 |
| `setNextAction` | `{ dealId, nextAction, nextActionDate, completedNote?: string }` | `{ id }` | `NEXT_ACTION_REQUIRED`, `CONFLICT` (deal não está `open`) | FR-023, FR-027 |
| `moveDeal` | `{ dealId, toStageId, toIndex }` | `{ status }` | `QUALIFICATION_REQUIRED`, `WON_DATA_REQUIRED`, `LOST_REASON_REQUIRED`, `STANDBY_DATE_REQUIRED`, `NEXT_ACTION_REQUIRED` (reabertura) | FR-011, FR-016–FR-020 |
| `closeDeal` | `{ dealId, toStageId, toIndex, won?: { dealType, mrr? }, lost?: { reason }, standby?: { reaquecerEm } }` | `{ status }` | idem `moveDeal` | FR-016–FR-018 |
| `reopenDeal` | `{ dealId, toStageId, toIndex, nextAction, nextActionDate }` | `{ status: 'open' }` | `NEXT_ACTION_REQUIRED`, `QUALIFICATION_REQUIRED` | US4 cenário 6 |
| `deleteDeal` | `{ id }` | `{}` | `FORBIDDEN` (não gestor) | FR-008 |

**Fluxo do Kanban.** Ao soltar um card numa etapa de desfecho, o client **não** chama
`moveDeal`: ele abre o `CloseDealDialog`. Se o usuário confirmar, chama `closeDeal`; se cancelar,
faz rollback local, sem chamada (FR-020). Para destinos `open` vindos de um desfecho, o client
abre o diálogo de próxima ação e chama `reopenDeal`. Mesmo assim, `moveDeal` valida tudo no
servidor e devolve o código do dado faltante se for chamada indevidamente.

`setNextAction` com `completedNote` grava uma `note` (a ação concluída) e depois o
`next_action_change`, na mesma chamada de serviço.

## Contatos e empresas: `app/actions/contacts.ts`, `app/actions/companies.ts`

| Action | Entrada | Saída | Erros | FR |
|---|---|---|---|---|
| `createCompany` / `updateCompany` | `{ id?, name, domain? }` | `{ id }` | `VALIDATION` | FR-005 |
| `createContact` | `{ name, email, phone?, companyId?, origem = 'outbound' }` | `{ id }` | `CONTACT_EMAIL_TAKEN` (+ `existingId`) | FR-006, US3 cenário 3 |
| `updateContact` | `{ id, …campos }` | `{ id }` | `CONTACT_EMAIL_TAKEN` | FR-006 |
| `deleteContact` | `{ id }` | `{}` | `CONTACT_HAS_DEALS` | FR-008 |
| `createLead` | `{ company?: {id} \| {name, domain?}, contact: {id} \| {…novo}, deal: {…createDeal sem contactId} }` | `{ companyId, contactId, dealId }` | união dos acima | US3, SC-005 |

`createLead` é o atalho "novo lead" (empresa + contato + deal num formulário só). O serviço grava
em sequência; se o deal falhar, ele remove o contato e a empresa criados nesta chamada.

As buscas (`searchContacts`, `searchCompanies`) são leituras dos Server Components via
repositório, não actions.

## Atividades: `app/actions/activities.ts`

| Action | Entrada | Saída | FR |
|---|---|---|---|
| `addNote` | `{ dealId? , contactId?, type: 'note' \| 'call_note', content (1–5000) }` | `{ id }` | FR-029 |

Com `dealId`, o serviço preenche `contactId` a partir do deal.

## Etapas (só gestor): `app/actions/stages.ts`

| Action | Entrada | Erros | FR |
|---|---|---|---|
| `createStage` | `{ name, probability (0–100), color, afterStageId }` | `FORBIDDEN`, `VALIDATION` | FR-014 |
| `updateStage` | `{ id, name?, probability?, color? }` | `FORBIDDEN` | FR-014 |
| `reorderStages` | `{ orderedIds: string[] }` | `FORBIDDEN`, `VALIDATION` (as etapas de desfecho ficam depois das abertas) | FR-014 |
| `deleteStage` | `{ id }` | `FORBIDDEN`, `STAGE_NOT_DELETABLE` (tem deals, `kind<>'open'` ou `key` de sistema) | FR-014 |

## Membros (só gestor): `app/actions/members.ts`

| Action | Entrada | Erros | FR |
|---|---|---|---|
| `inviteMember` | `{ name, email, role }` | `FORBIDDEN`, `CONFLICT` (e-mail já existe) | FR-003, US6 cenário 4 |
| `updateMemberRole` | `{ id, role }` | `FORBIDDEN`, `CONFLICT` (remover o último gestor) | FR-003 |
| `setMemberActive` | `{ id, active }` | `FORBIDDEN`, `CONFLICT` (desativar a si mesmo / último gestor) | FR-003 |

## Sessão: `app/actions/auth.ts`

| Action | Entrada | Efeito | FR |
|---|---|---|---|
| _(login)_ | — | **não é Server Action**: o `LoginForm` chama `signInWithPassword` no client (rate limit nativo do Supabase Auth). Membro banido/inativo recebe o erro genérico "E-mail ou senha inválidos" | FR-001 |
| `signOut` | — | encerra a sessão, redireciona para `/login` | FR-004 |
