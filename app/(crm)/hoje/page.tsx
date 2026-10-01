import { OwnerFilter } from '@/components/common/OwnerFilter';
import { PageHeader } from '@/components/common/PageHeader';
import { TodayList } from '@/components/today/TodayList';
import { getServiceContext } from '@/lib/actions/context';
import { todayInSaoPaulo } from '@/lib/dates';
import { formatDate } from '@/lib/format';
import { getTodayList } from '@/lib/services/today/getTodayList';

export default async function TodayPage({ searchParams }: PageProps<'/hoje'>) {
  const ctx = await getServiceContext();
  const params = await searchParams;
  const isGestor = ctx.viewer.role === 'gestor';
  const owner = isGestor && typeof params.owner === 'string' ? params.owner : 'me';
  const today = todayInSaoPaulo();

  const [items, members] = await Promise.all([
    getTodayList(ctx, { owner, today }),
    isGestor ? ctx.repos.profiles.listActive() : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeader
        title="Hoje"
        subtitle={`Follow-ups de hoje (${formatDate(today)}) e atrasados.`}
        actions={
          isGestor && (
            <OwnerFilter
              label="Ver"
              value={owner}
              leading={[{ value: 'me', label: 'Meus' }]}
              members={members.filter((member) => member.id !== ctx.viewer.id)}
              trailing={[{ value: 'team', label: 'Time inteiro' }]}
            />
          )
        }
      />
      <TodayList items={items} today={today} showOwner={isGestor && owner !== 'me'} />
    </>
  );
}
