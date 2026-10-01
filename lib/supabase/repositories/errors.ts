import type { PostgrestError } from '@supabase/supabase-js';
import { log } from '@/lib/log';
import { DomainError } from '@/lib/services/errors';

/** Converte erros do PostgREST/Postgres em DomainError com mensagem pt-BR. */
export function toDomainError(error: PostgrestError): DomainError {
  switch (error.code) {
    case '42501':
      return new DomainError('FORBIDDEN', 'Você não tem permissão para fazer isso.');
    case 'P0002':
    case 'PGRST116':
      return new DomainError('NOT_FOUND', 'Registro não encontrado.');
    case '23505':
      return new DomainError('CONFLICT', 'Já existe um registro com esses dados.', { meta: { constraint: error.details } });
    case '23503':
      return new DomainError('CONFLICT', 'Este registro está ligado a outros e não pode ser alterado assim.');
    case '23514':
    case '22023':
      return new DomainError('VALIDATION', 'Os dados não passaram nas regras do CRM.');
    default:
      log.error('db_error', { pgCode: error.code });
      return new DomainError('INTERNAL', 'Erro ao acessar o banco de dados.');
  }
}

type DbResult = { data: unknown; error: PostgrestError | null };

/** Resultado de lista/insert/single: erro vira DomainError; sem erro, há dados. */
export function check<R extends DbResult>(result: R): Exclude<R['data'], null> {
  if (result.error) throw toDomainError(result.error);
  return result.data as Exclude<R['data'], null>;
}

/** Resultado de maybeSingle: `null` quando não encontrado. */
export function checkMaybe<R extends DbResult>(result: R): R['data'] {
  if (result.error) throw toDomainError(result.error);
  return result.data;
}

/** Escrita sem retorno (update/delete/rpc void): só propaga o erro. */
export function checkOk(result: DbResult): void {
  if (result.error) throw toDomainError(result.error);
}

/** Remove caracteres que quebram filtros `or()`/`ilike` do PostgREST. */
export function sanitizeSearch(q: string): string {
  return q.replace(/[%_,()*\\:"']/g, ' ').trim().slice(0, 80);
}
