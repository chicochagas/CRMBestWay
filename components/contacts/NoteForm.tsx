'use client';

import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { addNote } from '@/app/actions/activities';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAction } from '@/lib/hooks/useAction';
import { cn } from '@/lib/utils';

/** Nota rápida ou nota de call (FR-029). Ctrl+Enter envia. */
export function NoteForm({ dealId, contactId }: { dealId?: string; contactId?: string }) {
  const [type, setType] = useState<'note' | 'call_note'>('note');
  const formRef = useRef<HTMLFormElement>(null);
  const { run, pending, fieldErrors } = useAction(addNote, {
    successMessage: 'Nota registrada.',
    onSuccess: () => formRef.current?.reset(),
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = String(new FormData(event.currentTarget).get('content') ?? '');
    await run({ type, content, dealId, contactId });
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) formRef.current?.requestSubmit();
  }

  const fieldId = `note-${dealId ?? contactId}`;

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-2" noValidate>
      <div role="radiogroup" aria-label="Tipo de nota" className="flex gap-1">
        {(['note', 'call_note'] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={type === option}
            onClick={() => setType(option)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium',
              type === option ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
            )}
          >
            {option === 'note' ? 'Nota' : 'Nota de call'}
          </button>
        ))}
      </div>
      <label htmlFor={fieldId} className="sr-only">
        Conteúdo da nota
      </label>
      <Textarea
        id={fieldId}
        name="content"
        rows={3}
        maxLength={5000}
        placeholder="Escreva aqui… (Ctrl+Enter envia)"
        onKeyDown={onKeyDown}
        aria-invalid={Boolean(fieldErrors.content)}
      />
      {fieldErrors.content && (
        <p role="alert" className="text-xs font-medium text-danger">
          {fieldErrors.content}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Salvando…' : 'Adicionar'}
        </Button>
      </div>
    </form>
  );
}
