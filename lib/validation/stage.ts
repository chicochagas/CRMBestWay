import { z } from 'zod';
import { idSchema } from './common';

const name = z.string('Informe o nome.').trim().min(1, 'Informe o nome.').max(60, 'Use no máximo 60 caracteres.');
const probability = z.coerce
  .number('Probabilidade inválida.')
  .int('Use um número inteiro.')
  .min(0, 'A probabilidade vai de 0 a 100.')
  .max(100, 'A probabilidade vai de 0 a 100.');
const color = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Use uma cor no formato #RRGGBB.');

export const createStageSchema = z.object({ name, probability, color, afterStageId: idSchema });
export const updateStageSchema = z.object({
  id: idSchema,
  name: name.optional(),
  probability: probability.optional(),
  color: color.optional(),
});
export const reorderStagesSchema = z.object({ orderedIds: z.array(idSchema).min(1) });

export type CreateStageInput = z.infer<typeof createStageSchema>;
export type UpdateStageInput = z.infer<typeof updateStageSchema>;
