'use client';

import { setMemberActive, updateMemberRole } from '@/app/actions/members';
import { selectClassName } from '@/components/common/Field';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Profile, Role } from '@/lib/domain';
import { useAction } from '@/lib/hooks/useAction';

type Member = Profile & { email: string };

export function MembersTable({ members, currentUserId }: { members: Member[]; currentUserId: string }) {
  const role = useAction(updateMemberRole, { successMessage: 'Papel atualizado.' });
  const active = useAction(setMemberActive);

  async function toggleActive(member: Member) {
    const next = !member.active;
    const verb = next ? 'Reativar' : 'Desativar';
    if (!window.confirm(`${verb} ${member.name}? ${next ? '' : 'A pessoa perde o acesso; os deals dela continuam com o nome dela.'}`)) return;
    await active.run({ id: member.id, active: next });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>E-mail</TableHead>
          <TableHead>Papel</TableHead>
          <TableHead>Situação</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id} className={member.active ? '' : 'text-muted-foreground'}>
            <TableCell className="font-medium">
              {member.name}
              {member.id === currentUserId && ' (você)'}
            </TableCell>
            <TableCell>{member.email}</TableCell>
            <TableCell>
              <label className="sr-only" htmlFor={`role-${member.id}`}>
                Papel de {member.name}
              </label>
              <select
                id={`role-${member.id}`}
                className={`${selectClassName} w-36`}
                defaultValue={member.role}
                disabled={role.pending || !member.active}
                onChange={(event) => role.run({ id: member.id, role: event.target.value as Role })}
              >
                <option value="vendedor">Vendedor</option>
                <option value="gestor">Gestor</option>
              </select>
            </TableCell>
            <TableCell>{member.active ? 'Ativo' : 'Inativo'}</TableCell>
            <TableCell className="text-right">
              {member.id !== currentUserId && (
                <Button variant="outline" size="sm" disabled={active.pending} onClick={() => toggleActive(member)}>
                  {member.active ? 'Desativar' : 'Reativar'}
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
