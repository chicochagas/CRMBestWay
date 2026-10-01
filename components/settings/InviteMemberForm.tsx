'use client';

import { useRef, type FormEvent } from 'react';
import { inviteMember } from '@/app/actions/members';
import { Field, selectClassName } from '@/components/common/Field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAction } from '@/lib/hooks/useAction';

/** Convite por e-mail: a pessoa define a senha pelo link e passa a ser opção de dono (US6-4). */
export function InviteMemberForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const { run, pending, fieldErrors } = useAction(inviteMember, {
    successMessage: 'Convite enviado.',
    onSuccess: () => formRef.current?.reset(),
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run({ name: String(form.get('name') ?? ''), email: String(form.get('email') ?? ''), role: String(form.get('role') ?? '') });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr_10rem_auto] sm:items-end" noValidate>
      <Field label="Nome" htmlFor="invite-name" error={fieldErrors.name}>
        <Input id="invite-name" name="name" required maxLength={80} />
      </Field>
      <Field label="E-mail" htmlFor="invite-email" error={fieldErrors.email}>
        <Input id="invite-email" name="email" type="email" required />
      </Field>
      <Field label="Papel" htmlFor="invite-role" error={fieldErrors.role}>
        <select id="invite-role" name="role" className={selectClassName} defaultValue="vendedor">
          <option value="vendedor">Vendedor</option>
          <option value="gestor">Gestor</option>
        </select>
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? 'Enviando…' : 'Convidar'}
      </Button>
    </form>
  );
}
