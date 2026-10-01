'use client';

import type { FormEvent } from 'react';
import { updateCompany } from '@/app/actions/companies';
import { Field } from '@/components/common/Field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Company } from '@/lib/domain';
import { useAction } from '@/lib/hooks/useAction';

export function CompanyForm({ company }: { company: Company }) {
  const { run, pending, fieldErrors } = useAction(updateCompany, { successMessage: 'Empresa atualizada.' });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run({ id: company.id, name: String(form.get('name') ?? ''), domain: String(form.get('domain') ?? '') });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3" noValidate>
      <Field label="Nome" htmlFor="company-name" error={fieldErrors.name}>
        <Input id="company-name" name="name" defaultValue={company.name} required maxLength={120} />
      </Field>
      <Field label="Domínio" htmlFor="company-domain" error={fieldErrors.domain}>
        <Input id="company-domain" name="domain" defaultValue={company.domain ?? ''} placeholder="empresa.com.br" />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? 'Salvando…' : 'Salvar empresa'}
        </Button>
      </div>
    </form>
  );
}
