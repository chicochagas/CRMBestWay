import { expect } from 'vitest';
import type { ErrorCode } from '@/lib/services/errors';

/** Espera que a promessa (ou função) falhe com um DomainError do código dado. */
export async function expectCode(action: Promise<unknown> | (() => unknown), code: ErrorCode) {
  const run = typeof action === 'function' ? Promise.resolve().then(action) : action;
  await expect(run).rejects.toMatchObject({ name: 'DomainError', code });
}
