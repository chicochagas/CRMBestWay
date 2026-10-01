'use client';

import { Search } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

/** Busca sincronizada com `?q=` (debounce de 300 ms). */
export function SearchBox({ q, placeholder }: { q: string; placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [term, setTerm] = useState(q);

  useEffect(() => {
    if (term === q) return;
    const timer = setTimeout(() => {
      router.replace(term.trim() ? `${pathname}?q=${encodeURIComponent(term.trim())}` : pathname);
    }, 300);
    return () => clearTimeout(timer);
  }, [term, q, pathname, router]);

  return (
    <label className="relative block max-w-md">
      <span className="sr-only">{placeholder}</span>
      <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={term} onChange={(event) => setTerm(event.target.value)} placeholder={placeholder} className="bg-card pl-8" />
    </label>
  );
}
