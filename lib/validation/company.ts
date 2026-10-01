import { z } from 'zod';
import { idSchema } from './common';

/** "https://www.Exemplo.com.br/" → "exemplo.com.br" */
export function normalizeDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '');
}

export const companyFields = {
  name: z.string('Informe o nome da empresa.').trim().min(1, 'Informe o nome da empresa.').max(120, 'Use no máximo 120 caracteres.'),
  domain: z
    .string()
    .optional()
    .transform((value) => (value ? normalizeDomain(value) || null : null)),
};

export const createCompanySchema = z.object(companyFields);
export const updateCompanySchema = z.object({ id: idSchema, ...companyFields });

export type CompanyInput = z.infer<typeof createCompanySchema>;
