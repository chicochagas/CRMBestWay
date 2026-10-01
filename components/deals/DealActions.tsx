'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { closeDeal, deleteDeal, reopenDeal } from '@/app/actions/deals';
import { Button } from '@/components/ui/button';
import type { DealCard, Stage, StageKind } from '@/lib/domain';
import { CloseDealDialog, type CloseData } from './CloseDealDialog';
import { ReopenDealDialog, type ReopenData } from './ReopenDealDialog';

type ClosedKind = Exclude<StageKind, 'open'>;
const LABELS: Record<ClosedKind, string> = { won: 'Ganho', lost: 'Perdido', standby: 'Stand-by' };

/** Fechar, reabrir e excluir a partir da página do deal (mesmas regras do Kanban). */
export function DealActions({ deal, stages, today, canDelete }: { deal: DealCard; stages: Stage[]; today: string; canDelete: boolean }) {
  const router = useRouter();
  const [closing, setClosing] = useState<Stage | null>(null);
  const [reopening, setReopening] = useState(false);
  const closedStages = stages.filter((stage): stage is Stage & { kind: ClosedKind } => stage.kind !== 'open');
  const openStages = stages.filter((stage) => stage.kind === 'open');

  async function confirmClose(data: CloseData) {
    const result = await closeDeal({ dealId: deal.id, toStageId: closing!.id, toIndex: 0, ...data });
    if (result.ok) {
      toast.success('Deal atualizado.');
      setClosing(null);
    }
    return result;
  }

  async function confirmReopen({ stageId, ...data }: ReopenData) {
    const result = await reopenDeal({ dealId: deal.id, toStageId: stageId, toIndex: 0, ...data });
    if (result.ok) {
      toast.success('Deal reaberto.');
      setReopening(false);
    }
    return result;
  }

  async function onDelete() {
    if (!window.confirm(`Excluir o deal "${deal.title}"? Esta ação não pode ser desfeita.`)) return;
    const result = await deleteDeal(deal.id);
    if (!result.ok) return void toast.error(result.message);
    toast.success('Deal excluído.');
    router.push(`/contacts/${result.data.contactId}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {deal.status === 'open' ? (
        closedStages.map((stage) => (
          <Button key={stage.id} variant="outline" size="sm" onClick={() => setClosing(stage)}>
            {LABELS[stage.kind]}
          </Button>
        ))
      ) : (
        <Button size="sm" onClick={() => setReopening(true)}>
          Reabrir
        </Button>
      )}
      {canDelete && (
        <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={onDelete}>
          Excluir deal
        </Button>
      )}

      {closing && closing.kind !== 'open' && (
        <CloseDealDialog
          open
          kind={closing.kind}
          stageName={closing.name}
          dealTitle={deal.title}
          today={today}
          onCancel={() => setClosing(null)}
          onConfirm={confirmClose}
        />
      )}
      <ReopenDealDialog
        open={reopening}
        dealTitle={deal.title}
        today={today}
        stageOptions={openStages}
        onCancel={() => setReopening(false)}
        onConfirm={confirmReopen}
      />
    </div>
  );
}
