'use client';

import { useEffect, useState } from 'react';
import { searchLeadOptions } from '@/app/actions/contacts';
import { Input } from '@/components/ui/input';

type Option = { id: string; label: string; detail?: string };

/** Busca (debounce 300 ms) e escolha de um contato ou empresa existente. */
export function RecordPicker({
  kind,
  id,
  selected,
  onSelect,
}: {
  kind: 'contacts' | 'companies';
  id: string;
  selected: Option | null;
  onSelect: (option: Option | null) => void;
}) {
  const [term, setTerm] = useState('');
  const [options, setOptions] = useState<Option[]>([]);

  useEffect(() => {
    if (term.trim().length < 2) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await searchLeadOptions(term);
      if (cancelled) return;
      setOptions(
        kind === 'contacts'
          ? result.contacts.map((c) => ({ id: c.id, label: c.name, detail: [c.email, c.companyName].filter(Boolean).join(' · ') }))
          : result.companies.map((c) => ({ id: c.id, label: c.name, detail: c.domain ?? undefined })),
      );
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term, kind]);

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-md border border-border bg-muted px-3 py-2 text-sm">
        <span>
          <strong>{selected.label}</strong>
          {selected.detail && <span className="text-muted-foreground"> · {selected.detail}</span>}
        </span>
        <button type="button" className="text-xs font-medium underline" onClick={() => onSelect(null)}>
          Trocar
        </button>
      </div>
    );
  }

  const visible = term.trim().length < 2 ? [] : options;

  return (
    <div className="grid gap-1">
      <Input
        id={id}
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder={kind === 'contacts' ? 'Buscar por nome ou e-mail' : 'Buscar empresa'}
        autoComplete="off"
      />
      {visible.length > 0 && (
        <ul className="max-h-40 overflow-y-auto rounded-md border border-border bg-card text-sm" role="listbox">
          {visible.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-muted"
                onClick={() => onSelect(option)}
              >
                {option.label}
                {option.detail && <span className="text-muted-foreground"> · {option.detail}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
