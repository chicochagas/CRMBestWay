-- Tira os helpers SECURITY DEFINER do schema exposto pela API (advisor 0029).
-- As policies referenciam as funções por OID, então continuam válidas após o move.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter function public.is_active_member() set schema private;
alter function public.is_gestor() set schema private;
