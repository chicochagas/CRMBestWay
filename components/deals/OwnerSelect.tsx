import { selectClassName } from '@/components/common/Field';
import type { PersonRef } from '@/lib/domain';

/**
 * Dono do deal: só membros ativos. Se o dono atual está inativo, aparece como opção
 * selecionada e desabilitada (os deals mantêm o nome dele até serem reatribuídos).
 */
export function OwnerSelect({
  id,
  name = 'ownerId',
  members,
  defaultValue,
  inactiveOwner,
  allowNone = false,
}: {
  id: string;
  name?: string;
  members: PersonRef[];
  defaultValue?: string | null;
  inactiveOwner?: PersonRef | null;
  allowNone?: boolean;
}) {
  return (
    <select id={id} name={name} className={selectClassName} defaultValue={defaultValue ?? ''}>
      {allowNone && <option value="">Sem dono</option>}
      {inactiveOwner && (
        <option value={inactiveOwner.id} disabled>
          {inactiveOwner.name} (inativo)
        </option>
      )}
      {members.map((member) => (
        <option key={member.id} value={member.id}>
          {member.name}
        </option>
      ))}
    </select>
  );
}
