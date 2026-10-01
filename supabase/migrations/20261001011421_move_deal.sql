-- Movimento atômico do Kanban (PRD Apêndice A, emenda v2.2; contrato em
-- specs/001-pipeline-hoje/contracts/routes.md).
-- Renumera as colunas de origem e destino e aplica p_patch na MESMA transação.
-- Não valida regra de negócio: isso fica em lib/services/deals/transitions.ts.

create function public.move_deal(
  p_deal_id uuid,
  p_stage_id uuid,
  p_index int,
  p_patch jsonb default '{}'::jsonb
) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_allowed constant text[] := array[
    'status','deal_type','mrr','lost_reason','reaquecer_em','next_action','next_action_date','qualified_at'
  ];
  v_patch jsonb := coalesce(p_patch, '{}'::jsonb);
  v_from uuid;
  v_key text;
  v_ids uuid[];
  v_n int;
  v_idx int;
begin
  for v_key in select jsonb_object_keys(v_patch) loop
    if not (v_key = any (v_allowed)) then
      raise exception 'campo não permitido em p_patch: %', v_key using errcode = '22023';
    end if;
  end loop;

  select stage_id into v_from from public.deals where id = p_deal_id for update;
  if not found then
    raise exception 'deal não encontrado' using errcode = 'P0002';
  end if;

  -- trava as duas colunas em ordem determinística (evita deadlock entre movimentos simultâneos)
  perform 1 from public.deals where stage_id in (v_from, p_stage_id) order by id for update;

  -- nova ordem da coluna de destino, com o deal inserido em p_index (limitado a [0, n])
  select coalesce(array_agg(id order by position, created_at), '{}')
    into v_ids
    from public.deals
   where stage_id = p_stage_id and id <> p_deal_id;
  v_n := coalesce(array_length(v_ids, 1), 0);
  v_idx := greatest(0, least(coalesce(p_index, v_n), v_n));
  v_ids := v_ids[1:v_idx] || p_deal_id || v_ids[v_idx + 1:v_n];

  update public.deals d set
    stage_id         = p_stage_id,
    status           = case when v_patch ? 'status'           then v_patch->>'status'                  else d.status end,
    deal_type        = case when v_patch ? 'deal_type'        then v_patch->>'deal_type'               else d.deal_type end,
    mrr              = case when v_patch ? 'mrr'              then (v_patch->>'mrr')::numeric          else d.mrr end,
    lost_reason      = case when v_patch ? 'lost_reason'      then v_patch->>'lost_reason'             else d.lost_reason end,
    reaquecer_em     = case when v_patch ? 'reaquecer_em'     then (v_patch->>'reaquecer_em')::date    else d.reaquecer_em end,
    next_action      = case when v_patch ? 'next_action'      then v_patch->>'next_action'             else d.next_action end,
    next_action_date = case when v_patch ? 'next_action_date' then (v_patch->>'next_action_date')::date else d.next_action_date end,
    qualified_at     = case when v_patch ? 'qualified_at'     then (v_patch->>'qualified_at')::timestamptz else d.qualified_at end
  where d.id = p_deal_id;

  update public.deals d
     set position = t.ord - 1
    from unnest(v_ids) with ordinality as t(id, ord)
   where d.id = t.id and d.position is distinct from t.ord - 1;

  if v_from is distinct from p_stage_id then
    update public.deals d
       set position = t.ord - 1
      from (
        select id, row_number() over (order by position, created_at) as ord
          from public.deals
         where stage_id = v_from
      ) t
     where d.id = t.id and d.position is distinct from t.ord - 1;
  end if;
end $$;

revoke execute on function public.move_deal(uuid, uuid, int, jsonb) from public, anon;
grant execute on function public.move_deal(uuid, uuid, int, jsonb) to authenticated;
