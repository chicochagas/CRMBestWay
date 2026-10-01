import type { Viewer } from '@/lib/domain';
import type { Repos } from '@/lib/supabase/repositories/types';
import { DomainError } from './errors';

/** O que todo serviço recebe: repositórios (injetados) e o usuário logado. */
export type ServiceContext = { repos: Repos; viewer: Viewer };

export function requireGestor(viewer: Viewer): void {
  if (viewer.role !== 'gestor') {
    throw new DomainError('FORBIDDEN', 'Apenas gestores podem fazer isso.');
  }
}

export function notFound(what: string): DomainError {
  return new DomainError('NOT_FOUND', `${what} não encontrado.`);
}
