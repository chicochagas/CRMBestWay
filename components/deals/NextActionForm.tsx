'use client';

import type { FormEvent } from 'react';
import { setNextAction } from '@/app/actions/deals';
import { Field } from '@/components/common/Field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAction } from '@/lib/hooks/useAction';

type Props = {
  dealId: string;
  defaultAction?: string | null;
  defaultDate?: string;
  onDone?: () => void;
  onCancel?: () => void;
};

/** Concluir a ação atual (nota opcional) e agendar a próxima, sem sair da tela (FR-023). */
export function NextActionForm({ dealId, defaultAction, defaultDate, onDone, onCancel }: Props) {
  const { run, pending, fieldErrors } = useAction(setNextAction, {
    successMessage: 'Próxima ação agendada.',
    onSuccess: () => onDone?.(),
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run({
      dealId,
      completedNote: String(form.get('completedNote') ?? ''),
      nextAction: String(form.get('nextAction') ?? ''),
      nextActionDate: String(form.get('nextActionDate') ?? ''),
    });
  }

  const id = (name: string) => `${name}-${dealId}`;

  return (
    <form onSubmit={onSubmit} className="grid gap-3" noValidate>
      <Field label="O que foi feito (opcional)" htmlFor={id('completedNote')} error={fieldErrors.completedNote}>
        <Textarea id={id('completedNote')} name="completedNote" rows={2} placeholder="Ex.: liguei, pediu proposta" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-[1fr_11rem]">
        <Field label="Próxima ação" htmlFor={id('nextAction')} error={fieldErrors.nextAction}>
          <Input
            id={id('nextAction')}
            name="nextAction"
            defaultValue={defaultAction ?? ''}
            required
            maxLength={200}
            aria-invalid={Boolean(fieldErrors.nextAction)}
          />
        </Field>
        <Field label="Data" htmlFor={id('nextActionDate')} error={fieldErrors.nextActionDate}>
          <Input
            id={id('nextActionDate')}
            name="nextActionDate"
            type="date"
            defaultValue={defaultDate}
            required
            aria-invalid={Boolean(fieldErrors.nextActionDate)}
          />
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? 'Salvando…' : 'Salvar próxima ação'}
        </Button>
      </div>
    </form>
  );
}
