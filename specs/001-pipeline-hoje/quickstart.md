# Quickstart: validar "Pipeline + Hoje"

Guia para provar que a feature funciona de ponta a ponta. Os detalhes de dados e contratos ficam
em [data-model.md](./data-model.md) e [contracts/](./contracts/).

## Pré-requisitos

- Node.js 24 e npm 11.
- `.env` preenchido (modelo em `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `DATABASE_URL`.
- Migrations de `supabase/migrations/` (deltas aprovados em data-model.md) aplicadas com
  `npm run db:push`. O script lê `DATABASE_URL` do `.env` via `node --env-file`; no PowerShell,
  `"$DATABASE_URL"` não lê o `.env`.
- Supabase Auth → Email Templates → **Invite user**: link
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite`; **URL Configuration**:
  Site URL = URL do app (local: `http://localhost:3000`). Conferir também Authentication →
  **Rate Limits** (login por IP).
- No dashboard do Supabase: Authentication → Sign In / Providers → **desligar "Allow new users
  to sign up"**.
- Primeiro gestor: convidar pelo dashboard (Authentication → Users → Invite) e depois rodar no SQL
  Editor:
  `insert into public.profiles (id, name, role) select id, 'Nome', 'gestor' from auth.users where email = '<e-mail>';`

## Rodar e checar

```powershell
npm install
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # Vitest: serviços (transitions, getTodayList, dates)
npm run dev         # http://localhost:3000
npm run test:e2e    # Playwright (exige um projeto/branch Supabase de teste no .env.test)
```

Esperado: lint, typecheck e testes de unidade sem erro antes de qualquer validação manual.

## Cenários de validação manual

Use dois usuários: **G** (gestor) e **V** (vendedor, convidado por G). "Hoje" = data atual em São
Paulo.

| # | Passos | Resultado esperado | Cobre |
|---|---|---|---|
| 1 | Abrir `/pipeline` sem sessão | redireciona para `/login` | US6-1, FR-001 |
| 2 | G entra; vai a Configurações → Membros; convida V como vendedor; V abre o link do e-mail e define a senha | V cai em `/definir-senha`, entra no CRM e aparece como opção de dono | US6-2, US6-4 |
| 3 | V entra; "Novo lead": empresa + contato + deal sem próxima ação | bloqueio indicando os campos faltando | US3-1, FR-015 |
| 4 | Completar com próxima ação = hoje; salvar sem escolher dono | deal em "Novo lead", dono = V; aparece em `/hoje`; contador da sidebar = 1 | US3-2, SC-005 |
| 5 | Cadastrar outro contato com o mesmo e-mail (maiúsculas diferentes) | aviso + link para o existente | US3-3 |
| 6 | Criar deals de V: 2 para hoje, 1 com data de 3 dias atrás, 1 para amanhã; abrir `/hoje` | 3 itens: o atrasado primeiro ("3 dias", em vermelho), depois os 2 de hoje | US1-1, FR-021 |
| 7 | Num item de `/hoje`: concluir com nota e nova ação em +5 dias | item sai da lista; timeline do deal mostra a nota e a mudança de próxima ação com autor | US1-2, FR-023, FR-027 |
| 8 | V abre `/hoje` enquanto G tem deal atrasado | não vê os deals de G | US1-3 |
| 9 | G abre `/hoje`; filtra por V e por "time" | vê os próprios por padrão; o filtro funciona; "time" inclui deals sem dono | US1-4 |
| 10 | No Kanban, arrastar um deal outbound de "Novo lead" para "Diagnóstico agendado" | bloqueio: "precisa ser qualificado antes"; card volta | US4-4, FR-019 |
| 11 | Mover para "Qualificado" e depois para "Diagnóstico agendado"; reordenar a coluna; recarregar; abrir em outro navegador como G | etapa e ordem iguais nos dois | US2-2, US2-3, SC-006 |
| 12 | Arrastar para "Ganho" → escolher recorrente sem MRR; depois cancelar | bloqueio do MRR; ao cancelar, o card volta à origem sem mudanças | US4-1, US4-7 |
| 13 | Fechar como Perdido (motivo "timing") e outro como Stand-by (data futura) | ambos saem de `/hoje`; tentar Stand-by com data passada é bloqueado | US4-2, US4-3, US4-5 |
| 14 | Arrastar o Perdido de volta para "Negociação" | pede nova próxima ação + data antes de concluir | US4-6 |
| 15 | Abrir o contato com 2 deals | timeline combinada, mais recente primeiro | US5-3, FR-028 |
| 16 | V tenta acessar `/settings/stages` | 404; o item não aparece na sidebar | US7-3 |
| 17 | G cria a etapa "Piloto" (50%) após "Negociação"; tenta excluir "Ganho" e uma etapa com deals | a etapa aparece no Kanban; as duas exclusões são bloqueadas | US7-1, US7-2 |
| 18 | G desativa V | V perde o acesso; os deals de V continuam com o nome dele; V some das opções de dono | edge case "membro desativado" |
| 19 | Clicar em Sair | volta a `/login`; páginas exigem login | US6-3, FR-004 |

## Checagem de segurança (RLS)

Com a chave publicável e a sessão de V (ex.: pelo console do navegador com o client Supabase),
`delete` em `deals`, `insert` em `stages` e `update` em `profiles` devem falhar por RLS. Sem
sessão, qualquer `select` volta vazio. O mesmo pode ser conferido em
`get_advisors` (security) do Supabase, que deve vir sem alertas de RLS.
