import { z } from 'zod';
import { idSchema, isoDateSchema, optionalText } from './common';

// Próxima ação: texto 1–200; data YYYY-MM-DD (data passada é permitida e entra como atrasada).
export const nextActionFields = {
  nextAction: z
    .string('Informe a próxima ação.')
    .trim()
    .min(1, 'Informe a próxima ação.')
    .max(200, 'Use no máximo 200 caracteres.'),
  nextActionDate: isoDateSchema,
};

export const setNextActionSchema = z.object({
  dealId: idSchema,
  ...nextActionFields,
  completedNote: optionalText(5000),
});

export type SetNextActionInput = z.infer<typeof setNextActionSchema>;
