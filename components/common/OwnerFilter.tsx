'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { selectClassName } from '@/components/common/Field';
import type { PersonRef } from '@/lib/domain';

type Option = { value: string; label: string };

/** Select de dono sincronizado com `?owner=` (usado em "Hoje" pelo gestor e no Kanban). */
export function OwnerFilter({
  members,
  value,
  leading,
  trailing = [],
  label = 'Dono',
}: {
  members: PersonRef[];
  value: string;
  leading: Option[];
  trailing?: Option[];
  label?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('owner', next);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <select className={`${selectClassName} w-48`} value={value} onChange={(event) => onChange(event.target.value)}>
        {leading.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
        {trailing.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
