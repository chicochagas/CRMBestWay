import { daysOverdue } from '@/lib/dates';
import type { Viewer } from '@/lib/domain';
import type { OwnerFilter, Repos } from '@/lib/supabase/repositories/types';

export type TodayOwnerParam = 'me' | 'team' | string;

export type TodayItem = {
  dealId: string;
  title: string;
  value: number;
  stage: { id: string; name: string };
  contact: { id: string; name: string; email: string; phone: string | null };
  owner: { id: string; name: string } | null;
  nextAction: string;
  nextActionDate: string;
  daysOverdue: number;
};

/** Vendedor sempre vê só os próprios itens; gestor escolhe um vendedor ou o time inteiro. */
export function resolveOwnerFilter(viewer: Viewer, owner: TodayOwnerParam | undefined): OwnerFilter {
  if (viewer.role !== 'gestor' || !owner || owner === 'me') return { kind: 'me', ownerId: viewer.id };
  if (owner === 'team') return { kind: 'team' };
  return { kind: 'owner', ownerId: owner };
}

/** "Hoje" (FR-021): deals em aberto com ação vencendo hoje ou atrasada; atrasados primeiro. */
export async function getTodayList(
  { repos, viewer }: { repos: Repos; viewer: Viewer },
  { owner, today }: { owner?: TodayOwnerParam; today: string },
): Promise<TodayItem[]> {
  const deals = await repos.deals.listToday(resolveOwnerFilter(viewer, owner), today);

  return deals
    .filter((deal) => deal.status === 'open' && deal.nextActionDate && deal.nextActionDate <= today)
    .sort(
      (a, b) =>
        (a.nextActionDate ?? '').localeCompare(b.nextActionDate ?? '') || a.updatedAt.localeCompare(b.updatedAt),
    )
    .map((deal) => ({
      dealId: deal.id,
      title: deal.title,
      value: deal.value,
      stage: { id: deal.stage.id, name: deal.stage.name },
      contact: { id: deal.contact.id, name: deal.contact.name, email: deal.contact.email, phone: deal.contact.phone },
      owner: deal.owner ? { id: deal.owner.id, name: deal.owner.name } : null,
      nextAction: deal.nextAction ?? '',
      nextActionDate: deal.nextActionDate ?? today,
      daysOverdue: daysOverdue(deal.nextActionDate ?? today, today),
    }));
}

export function countToday({ repos, viewer }: { repos: Repos; viewer: Viewer }, today: string): Promise<number> {
  return repos.deals.countToday(viewer.id, today);
}
