import { z } from 'zod';

export const idSchema = z.uuid('Identificador inválido.');

export const isoDateSchema = z.iso.date('Data inválida.');

/** Texto opcional: string vazia ou só espaços vira undefined. */
export function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres.`)
    .optional()
    .transform((value) => (value ? value : undefined));
}
