'use client';

import { useState, type FormEvent } from 'react';
import { Field, selectClassName } from '@/components/common/Field';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { ActionResult } from '@/lib/actions/result';
import { addDays } from '@/lib/dates';
import { LOST_REASONS, LOST_REASON_LABELS, type DealType, type LostReason, type StageKind } from '@/lib/domain';

export type CloseData = {
  won?: { dealType: DealType; mrr?: number };
  lost?: { reason: LostReason };
  standby?: { reaquecerEm: string };
};

type Props = {
  open: boolean;
  kind: Exclude<StageKind, 'open'>;
  stageName: string;
  dealTitle: string;
  today: string;
  onCancel: () => void;
  onConfirm: (data: CloseData) => Promise<ActionResult<unknown>>;
};

const TITLES = { won: 'Marcar como ganho', lost: 'Marcar como perdido', standby: 'Colocar em stand-by' };

/** Pede os dados obrigatórios de cada desfecho (FR-016–FR-018). Cancelar não altera o deal (FR-020). */
export function CloseDealDialog({ open, kind, stageName, dealTitle, today, onCancel, onConfirm }: Props) {
  const [dealType, setDealType] = useState<DealType | ''>('');
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data: CloseData =
      kind === 'won'
        ? { won: { dealType: dealType as DealType, mrr: form.get('mrr') ? Number(form.get('mrr')) : undefined } }
        : kind === 'lost'
          ? { lost: { reason: String(form.get('reason') ?? '') as LostReason } }
          : { standby: { reaquecerEm: String(form.get('reaquecerEm') ?? '') } };

    setPending(true);
    const result = await onConfirm(data);
    setPending(false);
    if (!result.ok) setErrors(result.fieldErrors ?? { _: result.message });
  }

  function cancel() {
    setErrors({});
    setDealType('');
    onCancel();
  }

  const fieldError = (...keys: string[]) => keys.map((key) => errors[key]).find(Boolean);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !pending && cancel()}>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{TITLES[kind]}</DialogTitle>
            <DialogDescription>
              {dealTitle} → {stageName}
            </DialogDescription>
          </DialogHeader>

          {kind === 'won' && (
            <>
              <fieldset className="grid gap-2">
                <legend className="mb-1 text-sm font-medium">Tipo de contrato</legend>
                {(['pontual', 'recorrente'] as const).map((type) => (
                  <label key={type} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="dealType"
                      value={type}
                      checked={dealType === type}
                      onChange={() => setDealType(type)}
                    />
                    {type === 'pontual' ? 'Pontual (projeto)' : 'Recorrente (mensal)'}
                  </label>
                ))}
                {fieldError('dealType', 'won.dealType') && (
                  <p role="alert" className="text-xs font-medium text-danger">
                    {fieldError('dealType', 'won.dealType')}
                  </p>
                )}
              </fieldset>
              {dealType === 'recorrente' && (
                <Field label="MRR (R$ por mês)" htmlFor="mrr" error={fieldError('mrr', 'won.mrr')}>
                  <Input id="mrr" name="mrr" type="number" min="0.01" step="0.01" required autoFocus />
                </Field>
              )}
            </>
          )}

          {kind === 'lost' && (
            <Field label="Motivo da perda" htmlFor="reason" error={fieldError('reason', 'lost.reason')}>
              <select id="reason" name="reason" className={selectClassName} defaultValue="" required>
                <option value="" disabled>
                  Escolha…
                </option>
                {LOST_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {LOST_REASON_LABELS[reason]}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {kind === 'standby' && (
            <Field
              label="Reaquecer em"
              htmlFor="reaquecerEm"
              hint="Data futura para retomar o contato."
              error={fieldError('reaquecerEm', 'standby.reaquecerEm')}
            >
              <Input id="reaquecerEm" name="reaquecerEm" type="date" min={addDays(today, 1)} required />
            </Field>
          )}

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
              {pending ? 'Salvando…' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
