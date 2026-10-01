import { CalendarCheck, KanbanSquare, Layers, Users, UsersRound } from 'lucide-react';
import type { Viewer } from '@/lib/domain';
import { NavLink } from './NavLink';
import { UserMenu } from './UserMenu';

/** Navegação lateral (PRD §14). Em telas pequenas vira uma barra no topo com rolagem horizontal. */
export function Sidebar({ viewer, todayCount }: { viewer: Viewer; todayCount: number }) {
  return (
    <aside className="border-b border-sidebar-border bg-sidebar md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
      <div className="flex items-center justify-between px-4 py-3 md:px-5 md:py-6">
        <p className="text-base font-bold tracking-tight">
          Red<span className="text-brand">Rex</span>
          <span className="ml-1 text-xs font-medium text-muted-foreground">CRM</span>
        </p>
        <div className="md:hidden">
          <UserMenu viewer={viewer} compact />
        </div>
      </div>

      <nav aria-label="Navegação principal" className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-1 md:flex-col md:px-3">
        <NavLink href="/hoje" icon={<CalendarCheck className="size-4" />} badge={todayCount}>
          Hoje
        </NavLink>
        <NavLink href="/pipeline" icon={<KanbanSquare className="size-4" />}>
          Pipeline
        </NavLink>
        <NavLink href="/contacts" icon={<UsersRound className="size-4" />}>
          Contatos
        </NavLink>

        {viewer.role === 'gestor' && (
          <>
            <p className="mt-4 hidden px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:block">
              Configurações
            </p>
            <NavLink href="/settings/members" icon={<Users className="size-4" />}>
              Membros
            </NavLink>
            <NavLink href="/settings/stages" icon={<Layers className="size-4" />}>
              Etapas
            </NavLink>
          </>
        )}
      </nav>

      <div className="hidden border-t border-sidebar-border p-4 md:block">
        <UserMenu viewer={viewer} />
      </div>
    </aside>
  );
}
