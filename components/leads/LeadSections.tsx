'use client';

import { Field, selectClassName } from '@/components/common/Field';
import { Input } from '@/components/ui/input';
import { RecordPicker } from './RecordPicker';

export type Picked = { id: string; label: string; detail?: string } | null;
type Err = (...keys: string[]) => string | undefined;

function ModeToggle<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-4 text-sm">
      {options.map((option) => (
        <label key={option.value} className="flex items-center gap-1.5">
          <input type="radio" name={name} checked={value === option.value} onChange={() => onChange(option.value)} />
          {option.label}
        </label>
      ))}
    </div>
  );
}

export function LeadContactSection({
  mode,
  onMode,
  picked,
  onPick,
  err,
}: {
  mode: 'new' | 'existing';
  onMode: (mode: 'new' | 'existing') => void;
  picked: Picked;
  onPick: (picked: Picked) => void;
  err: Err;
}) {
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 text-sm font-semibold">Contato</legend>
      <ModeToggle
        name="contactMode"
        value={mode}
        onChange={onMode}
        options={[
          { value: 'new', label: 'Novo contato' },
          { value: 'existing', label: 'Contato existente' },
        ]}
      />
      {mode === 'existing' ? (
        <Field label="Contato" htmlFor="lead-contact-search" error={err('contact', 'contact.id')}>
          <RecordPicker kind="contacts" id="lead-contact-search" selected={picked} onSelect={onPick} />
        </Field>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome" htmlFor="lead-contactName" error={err('contact.name')}>
              <Input id="lead-contactName" name="contactName" required maxLength={120} />
            </Field>
            <Field label="E-mail" htmlFor="lead-contactEmail" error={err('contact.email', 'email')}>
              <Input id="lead-contactEmail" name="contactEmail" type="email" required />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Telefone (opcional)" htmlFor="lead-contactPhone" error={err('contact.phone')}>
              <Input id="lead-contactPhone" name="contactPhone" type="tel" placeholder="(11) 98765-4321" />
            </Field>
            <Field label="Origem" htmlFor="lead-origem">
              <select id="lead-origem" name="origem" className={selectClassName} defaultValue="outbound">
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
            </Field>
          </div>
        </>
      )}
    </fieldset>
  );
}

export function LeadCompanySection({
  mode,
  onMode,
  picked,
  onPick,
  err,
}: {
  mode: 'none' | 'new' | 'existing';
  onMode: (mode: 'none' | 'new' | 'existing') => void;
  picked: Picked;
  onPick: (picked: Picked) => void;
  err: Err;
}) {
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 text-sm font-semibold">Empresa</legend>
      <ModeToggle
        name="companyMode"
        value={mode}
        onChange={onMode}
        options={[
          { value: 'new', label: 'Nova empresa' },
          { value: 'existing', label: 'Empresa existente' },
          { value: 'none', label: 'Sem empresa' },
        ]}
      />
      {mode === 'existing' && (
        <Field label="Empresa" htmlFor="lead-company-search" error={err('company', 'company.id')}>
          <RecordPicker kind="companies" id="lead-company-search" selected={picked} onSelect={onPick} />
        </Field>
      )}
      {mode === 'new' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome da empresa" htmlFor="lead-companyName" error={err('company.name')}>
            <Input id="lead-companyName" name="companyName" required maxLength={120} />
          </Field>
          <Field label="Domínio (opcional)" htmlFor="lead-companyDomain">
            <Input id="lead-companyDomain" name="companyDomain" placeholder="empresa.com.br" />
          </Field>
        </div>
      )}
    </fieldset>
  );
}
