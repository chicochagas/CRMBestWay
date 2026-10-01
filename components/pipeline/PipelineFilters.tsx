'use client';

import { Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { OwnerFilter } from '@/components/common/OwnerFilter';
import { Input } from '@/components/ui/input';
import type { PersonRef } from '@/lib/domain';

/** Filtro por dono e busca (título, contato ou empresa) com debounce de 300 ms (FR-012). */
export function PipelineFilters({ members, owner, q }: { members: PersonRef[]; owner: string; q: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [term, setTerm] = useState(q);

  useEffect(() => {
    if (term === q) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (term.trim()) params.set('q', term.trim());
      else params.delete('q');
      router.replace(`${pathname}?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [term, q, pathname, router, searchParams]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <OwnerFilter members={members} value={owner} leading={[{ value: 'all', label: 'Todos' }]} />
      <label className="relative">
        <span className="sr-only">Buscar deals</span>
        <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Buscar deal, contato ou empresa"
          className="w-64 bg-card pl-8"
        />
      </label>
    </div>
  );
}
