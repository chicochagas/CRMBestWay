# Feature Specification: Pipeline comercial com próxima ação e tela "Hoje"

**Feature Branch**: `001-pipeline-hoje`

**Created**: 2026-09-30

**Status**: Draft

**Input**: User description: "Pipeline + Hoje: autenticação e perfis do time, cadastro de empresas, contatos e deals, Kanban com dono e próxima ação, timeline de atividades e tela 'Hoje' (PRD RF1–RF5)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver o que fazer hoje (Priority: P1)

O vendedor entra no CRM e, em poucos cliques, vê a lista dos follow-ups que vencem hoje e dos
que estão atrasados, do mais urgente para o menos urgente. De cada item ele chega ao deal,
registra o que fez e define a próxima ação com data.

**Why this priority**: É o "motor diário" do vendedor e a primeira pergunta do CRM (_o que eu
faço hoje?_). Sem ela, oportunidades esfriam por esquecimento, que é o problema central do PRD.

**Independent Test**: Com deals cadastrados (mesmo direto na base), um vendedor logado abre
"Hoje", vê só os seus follow-ups de hoje e atrasados, atualiza a próxima ação de um deles e o
item sai da lista (ou muda de posição) conforme a nova data.

**Acceptance Scenarios**:

1. **Given** o vendedor tem 2 deals com próxima ação para hoje, 1 atrasado há 3 dias e 1 para
   amanhã, **When** ele abre "Hoje", **Then** vê 3 itens: primeiro o atrasado (destacado como
   atrasado, com quantos dias), depois os 2 de hoje; o de amanhã não aparece.
2. **Given** um item na lista "Hoje", **When** o vendedor muda a próxima ação para daqui a
   5 dias, **Then** o item sai da lista "Hoje" e a nova ação aparece no deal.
3. **Given** deals de outro vendedor com ação atrasada, **When** o vendedor abre "Hoje",
   **Then** esses deals não aparecem na lista dele.
4. **Given** o gestor está logado, **When** ele abre "Hoje", **Then** vê os seus próprios
   itens por padrão e pode filtrar por qualquer vendedor ou ver o time inteiro.
5. **Given** o vendedor não tem nada para hoje nem atrasado, **When** abre "Hoje", **Then** vê
   uma mensagem clara de que está em dia.

---

### User Story 2 - Trabalhar o pipeline no Kanban (Priority: P1)

O vendedor vê o funil como colunas por etapa (com a probabilidade de cada uma). Cada card de
deal mostra título, empresa/contato, dono, valor e próxima ação com data (atrasada em
destaque). Ele arrasta deals entre etapas e reordena dentro da coluna, e isso fica salvo.

**Why this priority**: É onde o deal vive e avança; sem ele não há o que listar em "Hoje" nem
base para o forecast futuro.

**Independent Test**: Criar alguns deals, arrastá-los entre etapas e reordená-los; recarregar
a página e outro usuário ver a mesma ordem e etapas.

**Acceptance Scenarios**:

1. **Given** deals em várias etapas, **When** o usuário abre o pipeline, **Then** vê uma coluna
   por etapa na ordem do funil, com nome, probabilidade, quantidade de deals e soma dos valores.
2. **Given** um deal em "Diagnóstico realizado", **When** o usuário o arrasta para "Proposta
   enviada", **Then** o deal fica na nova etapa após recarregar e a mudança aparece na timeline.
3. **Given** três deals numa coluna, **When** o usuário move o terceiro para o topo, **Then** a
   nova ordem persiste para todos os usuários.
4. **Given** um card cuja próxima ação venceu, **When** o pipeline é exibido, **Then** a data da
   ação aparece marcada como atrasada.
5. **Given** o usuário filtra o pipeline por dono, **When** escolhe um vendedor, **Then** só os
   deals daquele dono aparecem.

---

### User Story 3 - Cadastrar empresa, contato e deal (Priority: P1)

O vendedor cadastra um lead outbound: empresa, contato (nome, e-mail, telefone, origem) e o
deal (título, valor, dono, próxima ação e data). O deal já nasce com dono e próxima ação.

**Why this priority**: Sem cadastro não há pipeline. Inbound (Calendly) virá em outra feature;
aqui entra o caminho manual.

**Independent Test**: Criar uma empresa, um contato ligado a ela e um deal ligado ao contato;
o deal aparece em "Novo lead" no Kanban e, se a ação for para hoje, em "Hoje".

**Acceptance Scenarios**:

1. **Given** o formulário de novo deal, **When** o usuário tenta salvar sem próxima ação ou sem
   data da próxima ação, **Then** o sistema bloqueia e indica os campos faltando.
2. **Given** um novo deal sem dono escolhido, **When** é salvo, **Then** o dono é o usuário que
   o criou.
3. **Given** um contato com e-mail já cadastrado, **When** o usuário tenta cadastrar outro
   contato com o mesmo e-mail, **Then** o sistema avisa e oferece abrir o contato existente.
4. **Given** um contato existente, **When** o usuário cria um deal para ele, **Then** não é
   necessário recadastrar empresa nem contato.
5. **Given** contatos e empresas cadastrados, **When** o usuário busca por nome, e-mail ou
   empresa, **Then** encontra o registro e consegue editá-lo.

---

### User Story 4 - Fechar e regras do funil (Priority: P2)

O vendedor leva o deal até o desfecho: "Ganho" (informando se é pontual ou recorrente e, se
recorrente, o MRR), "Perdido" (com motivo padronizado) ou "Stand-by" (com data para reaquecer).
Deals outbound só chegam a "Diagnóstico agendado" depois de passar por "Qualificado".

**Why this priority**: Garante dados completos para forecast, ranking e "por que perdemos" nas
próximas features; sem isso os KPIs mentem. Vem depois de P1 porque o funil já gera valor
diário sem o fechamento estruturado.

**Independent Test**: Mover deals para "Ganho", "Perdido" e "Stand-by" e verificar que cada um
exige o dado correspondente; tentar pular "Qualificado" com um deal outbound e ver o bloqueio.

**Acceptance Scenarios**:

1. **Given** um deal em "Negociação", **When** o usuário o move para "Ganho", **Then** o sistema
   pede o tipo (pontual/recorrente) e, se recorrente, o MRR; sem isso a mudança não é concluída.
2. **Given** um deal em aberto, **When** é movido para "Perdido", **Then** o sistema exige um
   motivo da lista: preço, timing, concorrente, sem budget, sumiu, outro.
3. **Given** um deal em aberto, **When** é movido para "Stand-by", **Then** o sistema exige a
   data de reaquecer (futura).
4. **Given** um deal outbound em "Novo lead" que nunca esteve em "Qualificado", **When** o
   usuário tenta movê-lo para "Diagnóstico agendado" ou etapa posterior, **Then** o sistema
   bloqueia e explica que ele precisa ser qualificado antes.
5. **Given** um deal ganho, perdido ou em stand-by, **When** a lista "Hoje" é exibida, **Then**
   ele não aparece (não está mais em aberto).
6. **Given** um deal em "Stand-by" ou "Perdido", **When** o usuário o move de volta para uma
   etapa em aberto, **Then** o sistema exige uma nova próxima ação com data.
7. **Given** o usuário cancela o diálogo de fechamento, **When** o diálogo fecha, **Then** o
   deal volta para a etapa de origem sem alteração.

---

### User Story 5 - Timeline do deal e do contato (Priority: P2)

Na página do deal e na do contato, o usuário vê o histórico em ordem cronológica: notas e
notas de call registradas pelo time, mudanças de etapa e de próxima ação. Ele adiciona notas
rapidamente.

**Why this priority**: Dá contexto para o follow-up e é a base onde transcripts, análises e
propostas vão entrar nas próximas features.

**Independent Test**: Adicionar uma nota e uma nota de call a um deal, mover o deal de etapa e
conferir que os três registros aparecem na timeline do deal e na do contato, com autor e data.

**Acceptance Scenarios**:

1. **Given** um deal, **When** o usuário adiciona uma nota, **Then** ela aparece no topo da
   timeline com autor e data/hora.
2. **Given** um deal movido de etapa ou com próxima ação alterada, **When** a timeline é
   exibida, **Then** o evento aparece com quem fez e quando (de → para).
3. **Given** um contato com dois deals, **When** o usuário abre o contato, **Then** vê a
   timeline combinada dos dois deals e as notas do próprio contato.

---

### User Story 6 - Acesso do time e perfis (Priority: P1)

Só membros do time entram no CRM. Cada membro tem perfil com nome e papel (vendedor ou gestor),
usado como dono dos deals.

**Why this priority**: Pré-requisito de segurança e de "Hoje" por vendedor.

**Independent Test**: Tentar abrir qualquer tela sem login e ser levado ao login; entrar com uma
conta do time e ver o próprio nome e papel; sair e perder o acesso.

**Acceptance Scenarios**:

1. **Given** um visitante sem sessão, **When** abre qualquer página do CRM, **Then** é levado
   ao login.
2. **Given** credenciais válidas de um membro, **When** ele entra, **Then** chega ao CRM com o
   nome exibido na navegação.
3. **Given** um membro logado, **When** clica em sair, **Then** a sessão termina e as páginas
   voltam a exigir login.
4. **Given** um gestor, **When** cadastra um novo membro com nome, e-mail e papel, **Then** a
   pessoa recebe acesso e passa a aparecer como opção de dono de deal.

---

### User Story 7 - Gerenciar etapas do funil (Priority: P3)

O gestor ajusta o funil: renomeia etapas, muda probabilidade, cor e ordem, e adiciona etapas.

**Why this priority**: O funil padrão (9 etapas) atende o MVP; ajustar é refinamento.

**Independent Test**: Renomear uma etapa e alterar sua probabilidade; o Kanban reflete a
mudança para todos.

**Acceptance Scenarios**:

1. **Given** o funil padrão, **When** o gestor adiciona uma etapa com nome e probabilidade
   entre 0 e 100, **Then** ela aparece no Kanban na posição escolhida.
2. **Given** uma etapa com deals, **When** alguém tenta excluí-la, **Then** o sistema bloqueia
   até que os deals sejam movidos.
3. **Given** um vendedor (não gestor), **When** tenta alterar etapas, **Then** a ação não está
   disponível.

---

### Edge Cases

- Dois usuários movem o mesmo deal ao mesmo tempo: vale a última gravação, e o Kanban dos dois
  reflete o estado salvo ao recarregar; a timeline registra os dois movimentos.
- Falha ao salvar um arraste (rede): o card volta à posição anterior e o usuário vê um aviso.
- Próxima ação com data no passado ao cadastrar: permitido, mas o item já entra como atrasado.
- Contato sem telefone ou empresa: permitido; telefone é opcional nesta feature.
- Membro desativado que é dono de deals: os deals continuam visíveis com o nome dele e podem
  ser reatribuídos; ele não aparece mais como opção de novo dono.
- Deal sem dono (ex.: dono removido): aparece com indicação "sem dono" e entra na lista "Hoje"
  do gestor no filtro "time".
- Etapas "Ganho", "Perdido" e "Stand-by" não podem ser excluídas nem ter a regra de fechamento
  removida.
- Coluna com muitos deals: a coluna continua utilizável (rolagem) e os totais refletem todos.
- Fuso horário: "hoje" e "atrasado" são calculados no fuso de São Paulo.

## Requirements *(mandatory)*

### Functional Requirements

**Acesso e perfis (RF1)**

- **FR-001**: O sistema MUST exigir login para todas as telas e dados do CRM; sem sessão, o
  usuário é levado ao login.
- **FR-002**: O sistema MUST manter um perfil por membro com nome e papel (vendedor ou gestor).
- **FR-003**: Gestores MUST conseguir cadastrar, editar o papel e desativar membros; não há
  cadastro público.
- **FR-004**: Usuários MUST conseguir sair (encerrar sessão).

**Cadastro (RF2)**

- **FR-005**: Usuários MUST conseguir criar, ver, editar e buscar empresas (nome, domínio).
- **FR-006**: Usuários MUST conseguir criar, ver, editar e buscar contatos (nome, e-mail único,
  telefone opcional, empresa opcional, origem inbound/outbound).
- **FR-007**: Usuários MUST conseguir criar e editar deals com: contato, título, valor, dono,
  etapa, próxima ação e data da próxima ação.
- **FR-008**: O sistema MUST impedir a exclusão de contatos com deals; exclusão de deals só por
  gestor.

**Kanban (RF3)**

- **FR-009**: O sistema MUST exibir os deals como Kanban, uma coluna por etapa na ordem do
  funil, mostrando nome, probabilidade, contagem e soma de valores da coluna.
- **FR-010**: Cada card MUST exibir título, contato/empresa, dono, valor e próxima ação com data,
  destacando a ação atrasada.
- **FR-011**: Usuários MUST conseguir mover deals entre etapas e reordenar dentro da coluna
  arrastando; etapa e posição MUST persistir e ser vistas igualmente por todos.
- **FR-012**: O Kanban MUST permitir filtrar por dono e buscar por título, contato ou empresa.
- **FR-013**: O sistema MUST vir com o funil padrão: Novo lead (5%), Qualificado (15%),
  Diagnóstico agendado (25%), Diagnóstico realizado (40%), Proposta enviada (60%), Negociação
  (80%), Ganho (100%), Perdido (0%), Stand-by (10%).
- **FR-014**: Gestores MUST conseguir criar, renomear, reordenar e alterar probabilidade
  (0–100) e cor das etapas; etapas com deals ou de desfecho (Ganho, Perdido, Stand-by) não podem
  ser excluídas.

**Regras do funil e fechamento**

- **FR-015**: Todo deal em aberto MUST ter próxima ação e data; o sistema bloqueia salvar ou
  reabrir um deal sem elas.
- **FR-016**: Mover para "Ganho" MUST exigir tipo (pontual/recorrente) e, se recorrente, MRR
  maior que zero; o deal passa a ganho.
- **FR-017**: Mover para "Perdido" MUST exigir um motivo da lista padronizada (preço, timing,
  concorrente, sem budget, sumiu, outro); o deal passa a perdido.
- **FR-018**: Mover para "Stand-by" MUST exigir data de reaquecer futura; o deal passa a
  stand-by.
- **FR-019**: Deals de contatos outbound MUST passar por "Qualificado" antes de entrar em
  "Diagnóstico agendado" ou etapas posteriores.
- **FR-020**: Se o usuário cancelar o pedido de dados de fechamento, o deal MUST permanecer na
  etapa de origem.

**Próxima ação e "Hoje" (RF5)**

- **FR-021**: A tela "Hoje" MUST listar os deals em aberto do usuário logado cuja próxima ação
  vence hoje ou já venceu, com atrasados primeiro (do mais antigo ao mais recente) e depois os de
  hoje.
- **FR-022**: Cada item de "Hoje" MUST mostrar a próxima ação, dias de atraso (se houver), deal,
  contato com telefone/e-mail, etapa e valor, e permitir abrir o deal.
- **FR-023**: De "Hoje", o usuário MUST conseguir concluir a ação (registrando nota opcional) e
  definir a nova próxima ação com data sem sair da tela.
- **FR-024**: Gestores MUST conseguir ver "Hoje" de qualquer vendedor ou do time inteiro.
- **FR-025**: "Hoje" e "atrasado" MUST ser calculados no fuso America/Sao_Paulo.
- **FR-026**: "Hoje" MUST estar a no máximo um clique a partir de qualquer tela (navegação
  lateral) e mostrar a quantidade de itens pendentes.

**Timeline (RF4)**

- **FR-027**: O sistema MUST registrar na timeline do deal: notas, notas de call, mudanças de
  etapa e mudanças de próxima ação, com autor e data/hora.
- **FR-028**: A timeline do contato MUST combinar as atividades do contato e de todos os seus
  deals, em ordem cronológica decrescente.
- **FR-029**: Usuários MUST conseguir adicionar notas e notas de call a deals e contatos.

### Key Entities *(include if feature involves data)*

- **Membro (perfil)**: pessoa do time; nome, papel (vendedor/gestor), ativo/inativo. É dono de
  deals.
- **Empresa**: organização cliente; nome, domínio. Tem vários contatos.
- **Contato**: pessoa na empresa; nome, e-mail (único), telefone, origem (inbound/outbound).
  Pertence a no máximo uma empresa; tem vários deals.
- **Etapa**: fase do funil; nome, ordem, probabilidade (0–100), cor.
- **Deal**: oportunidade; contato, etapa, dono, título, valor, posição na coluna, situação
  (aberto/ganho/perdido/stand-by), próxima ação + data, tipo e MRR (ganho), motivo de perda,
  data de reaquecer, datas de criação/atualização.
- **Atividade**: registro na timeline; deal e/ou contato, tipo (nota, nota de call, mudança de
  etapa, mudança de próxima ação), conteúdo, autor, data/hora.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A partir do login, o vendedor vê sua lista "Hoje" em no máximo 2 cliques e menos
  de 5 segundos.
- **SC-002**: Concluir um follow-up e agendar o próximo a partir de "Hoje" leva menos de
  30 segundos.
- **SC-003**: 100% dos deals em aberto têm próxima ação e data em qualquer momento.
- **SC-004**: 100% dos deals ganhos têm tipo (e MRR se recorrente), 100% dos perdidos têm motivo
  padronizado e 100% dos em stand-by têm data de reaquecer.
- **SC-005**: Cadastrar um lead novo (empresa + contato + deal) leva menos de 2 minutos.
- **SC-006**: Movimentos no Kanban aparecem iguais para todos os usuários após recarregar, sem
  perda em 100% dos casos de teste.
- **SC-007**: Em 4 semanas de uso, nenhum deal em aberto fica mais de 7 dias com próxima ação
  atrasada sem atualização (medido pela própria lista "Hoje").

## Assumptions

- Login por e-mail e senha; contas criadas pelo gestor (sem cadastro público). Primeiro gestor é
  provisionado na implantação.
- Organização única: todo membro logado vê todos os deals (PRD: refinar por dono na Fase 3).
  Restrições por papel nesta feature: só gestor gerencia membros e etapas e exclui deals.
- Inbound via Calendly, transcript do tl;dv, análise por IA, propostas, playbooks, WhatsApp,
  metas, forecast e dashboard ficam em features próprias. Até o dashboard existir, a tela inicial
  após o login é o pipeline.
- Origem padrão de contato cadastrado manualmente é outbound; deals manuais começam em
  "Novo lead".
- O controle de presença (`attendance`) e o no-show pertencem à feature do tl;dv.
- Deals em stand-by não aparecem em "Hoje"; avisar sobre a data de reaquecer é do motor de
  alertas (Fase 2).
- Interface em português do Brasil, valores em reais (R$), uso em desktop; mobile não é alvo do
  MVP mas as telas não podem quebrar em telas menores.
- Mudanças de etapa ficam registradas também para medir tempo por etapa nos KPIs futuros.
