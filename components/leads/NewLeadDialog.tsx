'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { createLead } from '@/app/actions/contacts';
import { Field } from '@/components/common/Field';
import { OwnerSelect } from '@/components/deals/OwnerSelect';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { addDays } from '@/lib/dates';
import type { PersonRef } from '@/lib/domain';
import { useAction } from '@/lib/hooks/useAction';
import { LeadContactSection, LeadCompanySection, type Picked } from './LeadSections';

type Props = {
  members: PersonRef[];
  currentUserId: string;
  today: string;
  /** Contato fixo: "Novo deal para este contato" na página do contato. */
  fixedContact?: { id: string; name: string };
  triggerLabel?: string;
};

/** Empresa + contato + deal num formulário só (US3, SC-005 < 2 min). */
export function NewLeadDialog({ members, currentUserId, today, fixedContact, triggerLabel = 'Novo lead' }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [companyMode, setCompanyMode] = useState<'none' | 'new' | 'existing'>('new');
  const [contactMode, setContactMode] = useState<'new' | 'existing'>('new');
  const [company, setCompany] = useState<Picked>(null);
  const [contact, setContact] = useState<Picked>(null);

  const { run, pending, fieldErrors, lastError, reset } = useAction(createLead, {
    successMessage: 'Lead cadastrado.',
    onSuccess: (data) => {
      setOpen(false);
      router.push(`/deals/${data.dealId}`);
    },
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const get = (key: string) => String(form.get(key) ?? '');

    const contactInput = fixedContact
      ? { id: fixedContact.id }
      : contactMode === 'existing'
        ? contact && { id: contact.id }
        : { name: get('contactName'), email: get('contactEmail'), phone: get('contactPhone'), origem: get('origem') || 'outbound' };
    const companyInput =
      fixedContact || contactMode === 'existing' || companyMode === 'none'
        ? null
        : companyMode === 'existing'
          ? company && { id: company.id }
          : { name: get('companyName'), domain: get('companyDomain') };

    await run({
      company: companyInput,
      contact: contactInput,
      deal: {
        title: get('title'),
        value: get('value') || 0,
        ownerId: get('ownerId') || null,
        nextAction: get('nextAction'),
        nextActionDate: get('nextActionDate'),
      },
    });
  }

  const err = (...keys: string[]) => keys.map((key) => fieldErrors[key]).find(Boolean);
  const existingId = lastError?.code === 'CONTACT_EMAIL_TAKEN' ? (lastError.meta?.existingId as string | undefined) : undefined;

  return (
    <Dialog open={open} onOpenChange={(next) => (setOpen(next), next || reset())}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{fixedContact ? `Novo deal para ${fixedContact.name}` : 'Novo lead'}</DialogTitle>
          <DialogDescription>O deal nasce em “Novo lead”, com dono e próxima ação.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="grid gap-5">
          {!fixedContact && (
            <>
              <LeadContactSection mode={contactMode} onMode={setContactMode} picked={contact} onPick={setContact} err={err} />
              {existingId && (
                <p role="alert" className="-mt-3 text-sm">
                  Já existe um contato com este e-mail.{' '}
                  <Link href={`/contacts/${existingId}`} className="font-semibold underline">
                    Abrir contato
                  </Link>
                </p>
              )}
              {contactMode === 'new' && (
                <LeadCompanySection mode={companyMode} onMode={setCompanyMode} picked={company} onPick={setCompany} err={err} />
              )}
            </>
          )}

          <fieldset className="grid gap-3">
            <legend className="mb-1 text-sm font-semibold">Deal</legend>
            <Field label="Título" htmlFor="lead-title" error={err('deal.title')}>
              <Input id="lead-title" name="title" required maxLength={160} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Valor (R$)" htmlFor="lead-value" error={err('deal.value')}>
                <Input id="lead-value" name="value" type="number" min="0" step="0.01" defaultValue="0" />
              </Field>
              <Field label="Dono" htmlFor="lead-owner" error={err('deal.ownerId', 'ownerId')}>
                <OwnerSelect id="lead-owner" members={members} defaultValue={currentUserId} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_11rem]">
              <Field label="Próxima ação" htmlFor="lead-nextAction" error={err('deal.nextAction', 'nextAction')}>
                <Input id="lead-nextAction" name="nextAction" required maxLength={200} placeholder="Ex.: ligar para qualificar" />
              </Field>
              <Field label="Data" htmlFor="lead-nextActionDate" error={err('deal.nextActionDate')}>
                <Input id="lead-nextActionDate" name="nextActionDate" type="date" defaultValue={addDays(today, 1)} required />
              </Field>
            </div>
          </fieldset>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Salvando…' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
