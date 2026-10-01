// Erros de domínio: código estável + mensagem pt-BR pronta para exibir
// (contrato em specs/001-pipeline-hoje/contracts/server-actions.md).

export type ErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL'
  | 'NEXT_ACTION_REQUIRED'
  | 'WON_DATA_REQUIRED'
  | 'LOST_REASON_REQUIRED'
  | 'STANDBY_DATE_REQUIRED'
  | 'QUALIFICATION_REQUIRED'
  | 'CONTACT_EMAIL_TAKEN'
  | 'CONTACT_HAS_DEALS'
  | 'STAGE_NOT_DELETABLE';

export class DomainError extends Error {
  readonly code: ErrorCode;
  readonly field?: string;
  readonly meta?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, options: { field?: string; meta?: Record<string, unknown> } = {}) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.field = options.field;
    this.meta = options.meta;
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}
