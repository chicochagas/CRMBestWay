'use client';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { closeDeal, moveDeal, reopenDeal } from '@/app/actions/deals';
import { CloseDealDialog, type CloseData } from '@/components/deals/CloseDealDialog';
import { ReopenDealDialog, type ReopenData } from '@/components/deals/ReopenDealDialog';
import type { ActionResult } from '@/lib/actions/result';
import type { DealCard, Stage } from '@/lib/domain';
import { findContainer, moveAcross, reorderWithin, serverIndex, type BoardItems } from '@/lib/pipeline/boardState';
import { KanbanColumn } from './KanbanColumn';

type Pending = { deal: DealCard; toStage: Stage; toIndex: number; mode: 'close' | 'reopen' };

function toItems(columns: { stage: Stage; deals: DealCard[] }[]): BoardItems {
  return Object.fromEntries(columns.map((column) => [column.stage.id, column.deals]));
}

/**
 * Kanban com arraste otimista: a UI move na hora; se o servidor recusar, volta ao estado
 * anterior com aviso. Soltar em desfecho abre o diálogo de fechamento; cancelar desfaz (FR-020).
 */
export function KanbanBoard({
  columns,
  today,
  filtered,
}: {
  columns: { stage: Stage; deals: DealCard[] }[];
  today: string;
  filtered: boolean;
}) {
  const [items, setItems] = useState<BoardItems>(() => toItems(columns));
  const [sourceColumns, setSourceColumns] = useState(columns);
  const [pending, setPending] = useState<Pending | null>(null);
  const snapshot = useRef<BoardItems | null>(null);
  const stages = columns.map((column) => column.stage);

  // Dados novos do servidor (revalidação após a action) substituem o estado local.
  if (columns !== sourceColumns) {
    setSourceColumns(columns);
    setItems(toItems(columns));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function rollback(message?: string) {
    if (snapshot.current) setItems(snapshot.current);
    snapshot.current = null;
    if (message) toast.error(message);
  }

  async function settle(result: ActionResult<unknown>): Promise<ActionResult<unknown>> {
    if (result.ok) {
      snapshot.current = null;
      setPending(null);
    } else if (!result.fieldErrors) {
      // Erro sem campo (ex.: gate "Qualificado", rede): desfaz e avisa.
      setPending(null);
      rollback(result.message);
    }
    return result;
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!snapshot.current) snapshot.current = items;
    if (over) setItems((current) => moveAcross(current, String(active.id), String(over.id)));
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    const original = snapshot.current ?? items;
    snapshot.current = original;
    if (!over) return rollback();

    const activeId = String(active.id);
    const next = reorderWithin(items, activeId, String(over.id));
    setItems(next);

    const toStageId = findContainer(next, activeId);
    const fromStageId = findContainer(original, activeId);
    const list = next[toStageId ?? ''] ?? [];
    const deal = list.find((item) => item.id === activeId);
    const toStage = stages.find((stage) => stage.id === toStageId);
    if (!deal || !toStage || !fromStageId) return rollback();

    const unchanged =
      toStageId === fromStageId &&
      list.findIndex((item) => item.id === activeId) === (original[fromStageId] ?? []).findIndex((item) => item.id === activeId);
    if (unchanged) return void (snapshot.current = null);

    const toIndex = serverIndex(list, activeId, filtered);
    const changesStage = toStageId !== fromStageId;
    if (changesStage && toStage.kind !== 'open') return setPending({ deal, toStage, toIndex, mode: 'close' });
    if (changesStage && deal.status !== 'open') return setPending({ deal, toStage, toIndex, mode: 'reopen' });

    await settle(await moveDeal({ dealId: deal.id, toStageId: toStage.id, toIndex }));
  }

  function cancelPending() {
    setPending(null);
    rollback();
  }

  async function confirmClose(data: CloseData) {
    if (!pending) return { ok: false, code: 'INTERNAL', message: '' } as const;
    const { deal, toStage, toIndex } = pending;
    return settle(await closeDeal({ dealId: deal.id, toStageId: toStage.id, toIndex, ...data }));
  }

  async function confirmReopen(data: ReopenData) {
    if (!pending) return { ok: false, code: 'INTERNAL', message: '' } as const;
    const { deal, toStage, toIndex } = pending;
    return settle(await reopenDeal({ dealId: deal.id, toStageId: toStage.id, toIndex, ...data }));
  }

  return (
    <>
      <DndContext
        id="kanban"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => rollback()}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <KanbanColumn key={stage.id} stage={stage} deals={items[stage.id] ?? []} today={today} />
          ))}
        </div>
      </DndContext>

      {pending?.mode === 'close' && pending.toStage.kind !== 'open' && (
        <CloseDealDialog
          open
          kind={pending.toStage.kind}
          stageName={pending.toStage.name}
          dealTitle={pending.deal.title}
          today={today}
          onCancel={cancelPending}
          onConfirm={confirmClose}
        />
      )}
      {pending?.mode === 'reopen' && (
        <ReopenDealDialog
          open
          dealTitle={pending.deal.title}
          stage={pending.toStage}
          today={today}
          onCancel={cancelPending}
          onConfirm={confirmReopen}
        />
      )}
    </>
  );
}
