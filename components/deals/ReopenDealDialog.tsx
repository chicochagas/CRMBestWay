'use client';

import { useState, type FormEvent } from 'react';
import { Field, selectClassName } from '@/components/common/Field';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { ActionResult } from '@/lib/actions/result';
import { addDays } from '@/lib/dates';
import type { Stage } from '@/lib/domain';

export type ReopenData = { stageId: string; nextAction: string; nextActionDate: string };

type Props = {
  open: boolean;
  dealTitle: string;
  today: string;
  /** Etapa já escolhida (arraste no Kanban) ou lista para escolher (página do deal). */
  stage?: Stage;
  stageOptions?: Stage[];
  onCancel: () => void;
  onConfirm: (data: ReopenData) => Promise<ActionResult<unknown>>;
};

/** Reabrir exige nova próxima ação com data (US4-6). */
export function ReopenDealDialog({ open, dealTitle, today, stage, stageOptions = [], onCancel, onConfirm }: Props) {
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    const result = await onConfirm({
      stageId: stage?.id ?? String(form.get('stageId') ?? ''),
      nextAction: String(form.get('nextAction') ?? ''),
      nextActionDate: String(form.get('nextActionDate') ?? ''),
    });
    setPending(false);
    if (!result.ok) setErrors(result.fieldErrors ?? { _: result.message });
  }

  function cancel() {
    setErrors({});
    onCancel();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !pending && cancel()}>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Reabrir deal</DialogTitle>
            <DialogDescription>
              {dealTitle}
              {stage && ` → ${stage.name}`}. Defina a próxima ação para voltar ao funil.
            </DialogDescription>
          </DialogHeader>

          {!stage && (
            <Field label="Voltar para a etapa" htmlFor="stageId" error={errors.toStageId}>
              <select id="stageId" name="stageId" className={selectClassName} required>
                {stageOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Próxima ação" htmlFor="reopen-nextAction" error={errors.nextAction}>
            <Input id="reopen-nextAction" name="nextAction" required maxLength={200} autoFocus />
          </Field>
          <Field label="Data" htmlFor="reopen-nextActionDate" error={errors.nextActionDate}>
            <Input id="reopen-nextActionDate" name="nextActionDate" type="date" defaultValue={addDays(today, 1)} required />
          </Field>

          {errors._ && (
            <p role="alert" className="text-sm font-medium text-danger">
              {errors._}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={cancel} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Salvando…' : 'Reabrir'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
