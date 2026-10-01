'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type NavLinkProps = { href: string; icon: ReactNode; badge?: number; children: ReactNode };

export function NavLink({ href, icon, badge, children }: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-sidebar-accent',
      )}
    >
      {icon}
      <span>{children}</span>
      {badge !== undefined && badge > 0 && (
        <span
          aria-label={`${badge} pendentes`}
          className={cn(
            'ml-auto rounded-full px-2 py-0.5 text-xs font-semibold',
            active ? 'bg-lime text-primary' : 'bg-lime/70 text-primary',
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
