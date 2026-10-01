import { LogOut } from 'lucide-react';
import { signOut } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import type { Viewer } from '@/lib/domain';

const ROLE_LABEL = { gestor: 'Gestor', vendedor: 'Vendedor' } as const;

export function UserMenu({ viewer, compact = false }: { viewer: Viewer; compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {!compact && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{viewer.name}</p>
          <p className="text-xs text-muted-foreground">{ROLE_LABEL[viewer.role]}</p>
        </div>
      )}
      <form action={signOut}>
        <Button type="submit" variant="outline" size="sm" aria-label="Sair">
          <LogOut className="size-4" />
          <span className={compact ? 'sr-only' : ''}>Sair</span>
        </Button>
      </form>
    </div>
  );
}
