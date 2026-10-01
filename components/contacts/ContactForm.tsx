'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import { deleteContact, updateContact } from '@/app/actions/contacts';
import { Field, selectClassName } from '@/components/common/Field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Contact } from '@/lib/domain';
import { useAction } from '@/lib/hooks/useAction';

/** Edição do contato (FR-006). E-mail duplicado mostra link para o contato existente. */
export function ContactForm({ contact, hasDeals }: { contact: Contact; hasDeals: boolean }) {
  const router = useRouter();
  const { run, pending, fieldErrors, lastError } = useAction(updateContact, { successMessage: 'Contato atualizado.' });
  const existingId = lastError?.code === 'CONTACT_EMAIL_TAKEN' ? (lastError.meta?.existingId as string | undefined) : undefined;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run({
      id: contact.id,
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      phone: String(form.get('phone') ?? ''),
      companyId: contact.companyId,
      origem: String(form.get('origem') ?? contact.origem),
    });
  }

  async function onDelete() {
    if (!window.confirm(`Excluir o contato "${contact.name}"?`)) return;
    const result = await deleteContact(contact.id);
    if (!result.ok) return void toast.error(result.message);
    toast.success('Contato excluído.');
    router.push('/contacts');
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3" noValidate>
      <Field label="Nome" htmlFor="contact-name" error={fieldErrors.name}>
        <Input id="contact-name" name="name" defaultValue={contact.name} required maxLength={120} />
      </Field>
      <Field label="E-mail" htmlFor="contact-email" error={fieldErrors.email}>
        <Input id="contact-email" name="email" type="email" defaultValue={contact.email} required />
      </Field>
      {existingId && existingId !== contact.id && (
        <p className="text-sm">
          <Link href={`/contacts/${existingId}`} className="font-semibold underline">
            Abrir contato existente
          </Link>
        </p>
      )}
      <Field label="Telefone" htmlFor="contact-phone" error={fieldErrors.phone}>
        <Input id="contact-phone" name="phone" type="tel" defaultValue={contact.phone ?? ''} />
      </Field>
      <Field label="Origem" htmlFor="contact-origem">
        <select id="contact-origem" name="origem" className={selectClassName} defaultValue={contact.origem}>
          <option value="outbound">Outbound</option>
          <option value="inbound">Inbound</option>
        </select>
      </Field>
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-danger hover:text-danger"
          onClick={onDelete}
          disabled={hasDeals}
          title={hasDeals ? 'Contatos com deals não podem ser excluídos.' : undefined}
        >
          Excluir
        </Button>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? 'Salvando…' : 'Salvar contato'}
        </Button>
      </div>
    </form>
  );
}
