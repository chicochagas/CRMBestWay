import { z } from 'zod';
import { idSchema } from './common';

export const addNoteSchema = z
  .object({
    type: z.enum(['note', 'call_note']),
    content: z.string('Escreva a nota.').trim().min(1, 'Escreva a nota.').max(5000, 'Use no máximo 5000 caracteres.'),
    dealId: idSchema.optional(),
    contactId: idSchema.optional(),
  })
  .refine((value) => value.dealId || value.contactId, { message: 'Informe o deal ou o contato.', path: ['dealId'] });

export type AddNoteInput = z.infer<typeof addNoteSchema>;
