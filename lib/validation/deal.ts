import { z } from 'zod';
import { LOST_REASONS } from '@/lib/domain';
import { idSchema, isoDateSchema } from './common';
import { createCompanySchema } from './company';
import { createContactSchema } from './contact';
import { nextActionFields } from './nextAction';

const valueSchema = z.coerce
  .number('Valor inválido.')
  .min(0, 'O valor não pode ser negativo.')
  .transform((value) => Math.round(value * 100) / 100);

export const dealFields = {
  title: z.string('Informe o título.').trim().min(1, 'Informe o título.').max(160, 'Use no máximo 160 caracteres.'),
  value: valueSchema.default(0),
  ownerId: idSchema.nullish().transform((value) => value ?? null),
  ...nextActionFields,
};

export const createDealSchema = z.object({ contactId: idSchema, ...dealFields });

export const updateDealSchema = z.object({
  id: idSchema,
  title: dealFields.title.optional(),
  value: valueSchema.optional(),
  ownerId: idSchema.nullable().optional(),
});

/** "Novo lead": empresa e contato podem ser existentes ({ id }) ou novos. */
export const createLeadSchema = z.object({
  company: z.union([z.object({ id: idSchema }), createCompanySchema]).nullable().optional(),
  contact: z.union([z.object({ id: idSchema }), createContactSchema.omit({ companyId: true })]),
  deal: z.object(dealFields),
});

const moveTarget = {
  dealId: idSchema,
  toStageId: idSchema,
  toIndex: z.number().int().min(0),
};

export const moveDealSchema = z.object(moveTarget);

// Dados de fechamento (FR-016–FR-018). Regras condicionais ficam em transitions.ts.
export const wonSchema = z.object({
  dealType: z.enum(['pontual', 'recorrente'], 'Escolha pontual ou recorrente.'),
  mrr: z.coerce.number('MRR inválido.').optional(),
});
export const lostSchema = z.object({ reason: z.enum(LOST_REASONS, 'Escolha o motivo da perda.') });
export const standbySchema = z.object({ reaquecerEm: isoDateSchema });

export const closeDealSchema = z.object({
  ...moveTarget,
  won: wonSchema.optional(),
  lost: lostSchema.optional(),
  standby: standbySchema.optional(),
});

export const reopenDealSchema = z.object({ ...moveTarget, ...nextActionFields });

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type CloseDealInput = z.infer<typeof closeDealSchema>;
export type ReopenDealInput = z.infer<typeof reopenDealSchema>;
