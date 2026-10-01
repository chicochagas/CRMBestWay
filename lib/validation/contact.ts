import { z } from 'zod';
import { idSchema } from './common';

/**
 * Normaliza telefone para E.164 quando possível (útil ao WhatsApp futuro).
 * Só dígitos brasileiros (10–11) ganham +55; números já com código do país mantêm o "+".
 */
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;
  if (trimmed.startsWith('+')) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) return `+${digits}`;
  return trimmed;
}

export const contactFields = {
  name: z.string('Informe o nome.').trim().min(1, 'Informe o nome.').max(120, 'Use no máximo 120 caracteres.'),
  email: z
    .string('Informe o e-mail.')
    .trim()
    .toLowerCase()
    .pipe(z.email('E-mail inválido.')),
  phone: z
    .string()
    .optional()
    .transform((value) => (value ? normalizePhone(value) : null)),
  companyId: idSchema.nullish().transform((value) => value ?? null),
  origem: z.enum(['inbound', 'outbound']).default('outbound'),
};

export const createContactSchema = z.object(contactFields);
export const updateContactSchema = z.object({ id: idSchema, ...contactFields });

export type ContactInput = z.infer<typeof createContactSchema>;
