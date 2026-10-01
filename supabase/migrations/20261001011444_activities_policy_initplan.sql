-- auth.uid() avaliado uma vez por statement, não por linha (advisor 0003).
drop policy "activities: autor insere" on public.activities;
create policy "activities: autor insere" on public.activities for insert to authenticated
  with check (private.is_active_member() and author_id = (select auth.uid()));
