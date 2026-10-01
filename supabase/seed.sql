-- Funil padrão (FR-013). Idempotente: não duplica se as etapas de sistema já existem.
insert into public.stages (name, position, probability, color, kind, key) values
  ('Novo lead',             1,   5, '#A1A1AA', 'open',    'novo_lead'),
  ('Qualificado',           2,  15, '#818CF8', 'open',    'qualificado'),
  ('Diagnóstico agendado',  3,  25, '#F97316', 'open',    'diagnostico_agendado'),
  ('Diagnóstico realizado', 4,  40, '#F87171', 'open',    null),
  ('Proposta enviada',      5,  60, '#F59E0B', 'open',    null),
  ('Negociação',            6,  80, '#3B82F6', 'open',    null),
  ('Ganho',                 7, 100, '#22C55E', 'won',     'ganho'),
  ('Perdido',               8,   0, '#71717A', 'lost',    'perdido'),
  ('Stand-by',              9,  10, '#EAB308', 'standby', 'standby')
on conflict (key) do nothing;

-- Playbooks (usados na feature de templates; a IA preenche as {{variaveis}})
insert into public.templates (name, category, body)
select * from (values
  ('Diagnóstico — abertura', 'diagnostico', 'Roteiro p/ {{empresa}}: contexto, dores em dados, stack atual, orçamento, prazo, decisor.'),
  ('Objeção — "tá caro"',    'objecao',     'Reposicionar valor x custo de não resolver {{dor}}; ROI esperado; opção faseada.'),
  ('Follow-up pós-call',     'followup',    'Oi {{nome}}, ótimo papo sobre {{dor}}. Próximo passo: {{proximo_passo}}. Faz sentido {{data}}?'),
  ('Proposta — envio',       'proposta',    'Oi {{nome}}, segue a proposta para {{escopo}}. Validade até {{validade}}. Posso te ligar {{data}}?'),
  ('Reengajamento',          'reengajamento','Oi {{nome}}, voltando ao tema {{dor}}. Mudou algo no planejamento de {{trimestre}}?')
) as t(name, category, body)
where not exists (select 1 from public.templates);
