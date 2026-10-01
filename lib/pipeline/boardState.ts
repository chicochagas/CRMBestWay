// Estado local do Kanban durante o arraste (funções puras, testadas em tests/unit/lib).
import type { DealCard } from '@/lib/domain';

export type BoardItems = Record<string, DealCard[]>;

export function findContainer(items: BoardItems, id: string): string | undefined {
  if (id in items) return id;
  return Object.keys(items).find((stageId) => items[stageId]?.some((deal) => deal.id === id));
}

/** Leva o card para outra coluna durante o arraste (antes de soltar). */
export function moveAcross(items: BoardItems, activeId: string, overId: string): BoardItems {
  const from = findContainer(items, activeId);
  const to = findContainer(items, overId);
  if (!from || !to || from === to) return items;

  const fromList = items[from] ?? [];
  const toList = items[to] ?? [];
  const moved = fromList.find((deal) => deal.id === activeId);
  if (!moved) return items;

  const overIndex = toList.findIndex((deal) => deal.id === overId);
  const insertAt = overIndex >= 0 ? overIndex : toList.length;
  return {
    ...items,
    [from]: fromList.filter((deal) => deal.id !== activeId),
    [to]: [...toList.slice(0, insertAt), moved, ...toList.slice(insertAt)],
  };
}

/** Reordena dentro da mesma coluna ao soltar. */
export function reorderWithin(items: BoardItems, activeId: string, overId: string): BoardItems {
  const container = findContainer(items, activeId);
  if (!container) return items;
  const list = [...(items[container] ?? [])];
  const from = list.findIndex((deal) => deal.id === activeId);
  const to = overId in items ? list.length - 1 : list.findIndex((deal) => deal.id === overId);
  if (from < 0 || to < 0 || from === to) return items;
  const [moved] = list.splice(from, 1);
  list.splice(to, 0, moved!);
  return { ...items, [container]: list };
}

/**
 * Índice a enviar ao servidor (posição na coluna completa, sem o próprio deal).
 * Sem filtro, é o índice visível. Com filtro (dono/busca), há deals escondidos: usa a
 * posição real do vizinho visível para não "pular" por cima deles.
 */
export function serverIndex(list: DealCard[], dealId: string, filtered: boolean): number {
  const index = list.findIndex((deal) => deal.id === dealId);
  if (!filtered || index < 0) return Math.max(0, index);

  const moved = list[index]!;
  const prev = list[index - 1];
  const next = list[index + 1];
  const shift = (neighbor: DealCard) => (neighbor.stageId === moved.stageId && moved.position < neighbor.position ? 1 : 0);

  if (prev) return Math.max(0, prev.position + 1 - shift(prev));
  if (next) return Math.max(0, next.position - shift(next));
  return 0;
}
