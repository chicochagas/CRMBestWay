import { z } from 'zod';
import { idSchema } from './common';

const role = z.enum(['vendedor', 'gestor'], 'Escolha o papel.');

export const inviteMemberSchema = z.object({
  name: z.string('Informe o nome.').trim().min(2, 'Informe o nome (mínimo 2 letras).').max(80, 'Use no máximo 80 caracteres.'),
  email: z.string('Informe o e-mail.').trim().toLowerCase().pipe(z.email('E-mail inválido.')),
  role,
});
export const updateMemberRoleSchema = z.object({ id: idSchema, role });
export const setMemberActiveSchema = z.object({ id: idSchema, active: z.boolean() });

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
