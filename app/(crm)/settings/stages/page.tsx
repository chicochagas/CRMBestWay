import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/common/PageHeader';
import { StagesEditor } from '@/components/settings/StagesEditor';
import { getServiceContext } from '@/lib/actions/context';

export default async function StagesPage() {
  const ctx = await getServiceContext();
  if (ctx.viewer.role !== 'gestor') notFound();
  const stages = await ctx.repos.stages.listOrdered();

  return (
    <>
      <PageHeader
        title="Etapas do funil"
        subtitle="A probabilidade de cada etapa alimenta o forecast. Ganho, Perdido e Stand-by ficam sempre no fim."
      />
      <StagesEditor stages={stages} />
    </>
  );
}
