'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import type { ActionResult } from '@/lib/actions/result';

type Options<TData> = {
  successMessage?: string;
  onSuccess?: (data: TData) => void;
  /** Não mostra toast de erro (o componente exibe o erro por conta própria). */
  silentError?: boolean;
};

/**
 * Executa uma Server Action com estado de "pendente", erros por campo e toasts.
 * Devolve sempre o ActionResult para quem precisar decidir algo (ex.: rollback do Kanban).
 */
export function useAction<TInput, TData>(
  action: (input: TInput) => Promise<ActionResult<TData>>,
  options: Options<TData> = {},
) {
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [lastError, setLastError] = useState<Extract<ActionResult<TData>, { ok: false }> | null>(null);

  function run(input: TInput): Promise<ActionResult<TData>> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const result = await action(input);
        if (result.ok) {
          setFieldErrors({});
          setLastError(null);
          if (options.successMessage) toast.success(options.successMessage);
          options.onSuccess?.(result.data);
        } else {
          setFieldErrors(result.fieldErrors ?? {});
          setLastError(result);
          if (!options.silentError) toast.error(result.message);
        }
        resolve(result);
      });
    });
  }

  function reset() {
    setFieldErrors({});
    setLastError(null);
  }

  return { run, pending, fieldErrors, lastError, reset };
}
