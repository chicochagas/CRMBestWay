'use client';

import type { FormEvent } from 'react';
import { updateDeal } from '@/app/actions/deals';
import { Field } from '@/components/common/Field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DealCard, PersonRef } from '@/lib/domain';
import { useAction } from '@/lib/hooks/useAction';
import { OwnerSelect } from './OwnerSelect';

/** Edita título, valor e dono do deal (FR-007). */
export function DealForm({ deal, members }: { deal: DealCard; members: PersonRef[] }) {
  const { run, pending, fieldErrors } = useAction(updateDeal, { successMessage: 'Deal atualizado.' });
  const inactiveOwner = deal.owner && !deal.owner.active ? deal.owner : null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run({
      id: deal.id,
      title: String(form.get('title') ?? ''),
      value: String(form.get('value') ?? '0'),
      ownerId: String(form.get('ownerId') ?? '') || null,
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3" noValidate>
      <Field label="Título" htmlFor="deal-title" error={fieldErrors.title}>
        <Input id="deal-title" name="title" defaultValue={deal.title} required maxLength={160} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Valor (R$)" htmlFor="deal-value" error={fieldErrors.value}>
          <Input id="deal-value" name="value" type="number" min="0" step="0.01" defaultValue={deal.value} />
        </Field>
        <Field label="Dono" htmlFor="deal-owner" error={fieldErrors.ownerId}>
          <OwnerSelect
            id="deal-owner"
            members={members}
            defaultValue={deal.ownerId}
            inactiveOwner={inactiveOwner}
            allowNone
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? 'Salvando…' : 'Salvar dados'}
        </Button>
      </div>
    </form>
  );
}
