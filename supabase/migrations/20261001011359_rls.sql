-- RLS por papel (PRD Apêndice A, emenda v2.2).
-- Regra geral: membro ATIVO lê e escreve. Exceções por papel abaixo.

create function public.is_active_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active)
$$;

create function public.is_gestor() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'gestor' and active)
$$;

revoke execute on function public.is_active_member() from public, anon;
revoke execute on function public.is_gestor() from public, anon;
grant execute on function public.is_active_member() to authenticated;
grant execute on function public.is_gestor() to authenticated;

-- profiles: leitura por membros; só gestor altera/remove; insert só pela secret key (convite)
create policy "profiles: membro lê"     on public.profiles for select to authenticated using (public.is_active_member());
create policy "profiles: gestor altera" on public.profiles for update to authenticated using (public.is_gestor()) with check (public.is_gestor());
create policy "profiles: gestor remove" on public.profiles for delete to authenticated using (public.is_gestor());

-- companies
create policy "companies: membro lê"     on public.companies for select to authenticated using (public.is_active_member());
create policy "companies: membro cria"   on public.companies for insert to authenticated with check (public.is_active_member());
create policy "companies: membro altera" on public.companies for update to authenticated using (public.is_active_member()) with check (public.is_active_member());
create policy "companies: membro remove" on public.companies for delete to authenticated using (public.is_active_member());

-- contacts: não pode remover contato com deals
create policy "contacts: membro lê"     on public.contacts for select to authenticated using (public.is_active_member());
create policy "contacts: membro cria"   on public.contacts for insert to authenticated with check (public.is_active_member());
create policy "contacts: membro altera" on public.contacts for update to authenticated using (public.is_active_member()) with check (public.is_active_member());
create policy "contacts: remove sem deals" on public.contacts for delete to authenticated
  using (public.is_active_member() and not exists (select 1 from public.deals d where d.contact_id = contacts.id));

-- stages: leitura por membros; gestão só gestor
create policy "stages: membro lê"     on public.stages for select to authenticated using (public.is_active_member());
create policy "stages: gestor cria"   on public.stages for insert to authenticated with check (public.is_gestor());
create policy "stages: gestor altera" on public.stages for update to authenticated using (public.is_gestor()) with check (public.is_gestor());
create policy "stages: gestor remove" on public.stages for delete to authenticated using (public.is_gestor());

-- deals: exclusão só gestor
create policy "deals: membro lê"     on public.deals for select to authenticated using (public.is_active_member());
create policy "deals: membro cria"   on public.deals for insert to authenticated with check (public.is_active_member());
create policy "deals: membro altera" on public.deals for update to authenticated using (public.is_active_member()) with check (public.is_active_member());
create policy "deals: gestor remove" on public.deals for delete to authenticated using (public.is_gestor());

-- activities: timeline imutável; autoria sempre do usuário logado
create policy "activities: membro lê"    on public.activities for select to authenticated using (public.is_active_member());
create policy "activities: autor insere" on public.activities for insert to authenticated
  with check (public.is_active_member() and author_id = auth.uid());

-- tabelas das próximas features (mesma regra geral do MVP single-org)
create policy "proposals: membro"  on public.proposals  for all to authenticated using (public.is_active_member()) with check (public.is_active_member());
create policy "templates: membro"  on public.templates  for all to authenticated using (public.is_active_member()) with check (public.is_active_member());
create policy "goals: membro"      on public.goals      for all to authenticated using (public.is_active_member()) with check (public.is_active_member());
create policy "sync_state: membro" on public.sync_state for all to authenticated using (public.is_active_member()) with check (public.is_active_member());
