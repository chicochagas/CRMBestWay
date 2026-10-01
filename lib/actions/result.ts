import { unstable_rethrow } from 'next/navigation';
import { z } from 'zod';
import { log } from '@/lib/log';
import { DomainError, type ErrorCode } from '@/lib/services/errors';

export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: ErrorCode;
      message: string;
      fieldErrors?: Record<string, string>;
      meta?: Record<string, unknown>;
    };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(
  code: ErrorCode,
  message: string,
  extra: { fieldErrors?: Record<string, string>; meta?: Record<string, unknown> } = {},
): ActionResult<never> {
  return { ok: false, code, message, ...extra };
}

export function fromZodError(error: z.ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    fieldErrors[key] ??= issue.message;
  }
  return fail('VALIDATION', 'Revise os campos destacados.', { fieldErrors });
}

/**
 * Executa o corpo de uma Server Action convertendo erros em ActionResult.
 * Erros internos do Next (redirect, notFound) são relançados.
 */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return ok(await fn());
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof DomainError) {
      return fail(error.code, error.message, {
        fieldErrors: error.field ? { [error.field]: error.message } : undefined,
        meta: error.meta,
      });
    }
    if (error instanceof z.ZodError) return fromZodError(error);
    log.error('action_failed', { code: 'INTERNAL', detail: error instanceof Error ? error.name : 'unknown' });
    return fail('INTERNAL', 'Algo deu errado. Tente de novo em instantes.');
  }
}
