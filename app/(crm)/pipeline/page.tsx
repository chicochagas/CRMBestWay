import { PageHeader } from '@/components/common/PageHeader';
import { NewLeadDialog } from '@/components/leads/NewLeadDialog';
import { KanbanBoard } from '@/components/pipeline/KanbanBoard';
import { PipelineFilters } from '@/components/pipeline/PipelineFilters';
import { getServiceContext } from '@/lib/actions/context';
import { todayInSaoPaulo } from '@/lib/dates';
import { getBoard } from '@/lib/services/deals/getBoard';

export default async function PipelinePage({ searchParams }: PageProps<'/pipeline'>) {
  const ctx = await getServiceContext();
  const params = await searchParams;
  const owner = typeof params.owner === 'string' && params.owner !== 'all' ? params.owner : undefined;
  const q = typeof params.q === 'string' ? params.q : '';

  const [columns, members] = await Promise.all([
    getBoard(ctx, { ownerId: owner, q }),
    ctx.repos.profiles.listActive(),
  ]);

  return (
    <>
      <PageHeader
        title="Pipeline"
        subtitle="Arraste os deals entre as etapas. Ganho, Perdido e Stand-by pedem os dados de fechamento."
        actions={<NewLeadDialog members={members} currentUserId={ctx.viewer.id} today={todayInSaoPaulo()} />}
      />
      <div className="mb-4">
        <PipelineFilters members={members} owner={owner ?? 'all'} q={q} />
      </div>
      <KanbanBoard columns={columns} today={todayInSaoPaulo()} filtered={Boolean(owner || q)} />
    </>
  );
}
