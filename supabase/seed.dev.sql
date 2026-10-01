-- Dados de DESENVOLVIMENTO (nunca rodar em produção).
-- Pré-requisito: dois usuários já convidados e com perfil (um gestor e um vendedor).
-- Uso: troque os e-mails abaixo e rode no SQL Editor do Supabase.
do $$
declare
  gestor_email   constant text := 'gestor@exemplo.com';
  vendedor_email constant text := 'vendedor@exemplo.com';
  g uuid; v uuid;
  co1 uuid; co2 uuid;
  c1 uuid; c2 uuid; c3 uuid; c4 uuid;
  s_novo uuid; s_qual uuid; s_diag uuid; s_real uuid; s_prop uuid; s_neg uuid;
  hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  select id into g from auth.users where email = gestor_email;
  select id into v from auth.users where email = vendedor_email;
  if g is null or v is null then
    raise exception 'Convide % e % antes de rodar o seed.', gestor_email, vendedor_email;
  end if;

  select id into s_novo from public.stages where key = 'novo_lead';
  select id into s_qual from public.stages where key = 'qualificado';
  select id into s_diag from public.stages where key = 'diagnostico_agendado';
  select id into s_real from public.stages where name = 'Diagnóstico realizado';
  select id into s_prop from public.stages where name = 'Proposta enviada';
  select id into s_neg  from public.stages where name = 'Negociação';

  insert into public.companies (name, domain) values ('Açaí Data', 'acaidata.com.br') returning id into co1;
  insert into public.companies (name, domain) values ('Logística Sul', 'logsul.com.br') returning id into co2;

  insert into public.contacts (company_id, name, email, phone, origem)
    values (co1, 'Bruna Lima', 'bruna@acaidata.com.br', '+5511987654321', 'outbound') returning id into c1;
  insert into public.contacts (company_id, name, email, phone, origem)
    values (co1, 'Caio Rocha', 'caio@acaidata.com.br', null, 'inbound') returning id into c2;
  insert into public.contacts (company_id, name, email, phone, origem)
    values (co2, 'Dora Mendes', 'dora@logsul.com.br', '+5551999990000', 'outbound') returning id into c3;
  insert into public.contacts (name, email, origem)
    values ('Eva Nunes', 'eva@exemplo.com', 'inbound') returning id into c4;

  insert into public.deals (contact_id, stage_id, owner_id, title, value, position, next_action, next_action_date, qualified_at) values
    (c1, s_novo, v, 'Lakehouse Açaí',        45000, 0, 'Ligar para qualificar',   hoje - 3, null),
    (c2, s_qual, v, 'BI de vendas',           18000, 0, 'Enviar e-mail de agenda', hoje,     now()),
    (c3, s_diag, v, 'Data mesh LogSul',       90000, 0, 'Preparar diagnóstico',    hoje,     now()),
    (c4, s_real, v, 'Pipeline de dados Eva',  25000, 0, 'Montar proposta',         hoje + 1, now()),
    (c3, s_prop, g, 'Governança LogSul',      60000, 0, 'Follow-up da proposta',   hoje - 8, now()),
    (c1, s_neg,  null, 'Treinamento Açaí',    12000, 0, 'Negociar desconto',       hoje - 1, now());
end $$;
