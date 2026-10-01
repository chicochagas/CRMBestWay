import type { DealCard, Stage } from '@/lib/domain';
import type { ServiceContext } from '../context';

export type BoardColumn = { stage: Stage; deals: DealCard[]; count: number; total: number };

function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function matches(deal: DealCard, term: string): boolean {
  return [deal.title, deal.contact.name, deal.company?.name ?? ''].some((field) => normalize(field).includes(term));
}

/**
 * Kanban: uma coluna por etapa, na ordem do funil, com contagem e soma de `value` dos deals
 * filtrados. A soma é total simples; o forecast ponderado vive só em computeForecast (§V).
 */
export async function getBoard(
  { repos }: Pick<ServiceContext, 'repos'>,
  { ownerId, q }: { ownerId?: string; q?: string } = {},
): Promise<BoardColumn[]> {
  const [stages, deals] = await Promise.all([repos.stages.listOrdered(), repos.deals.listBoard({ ownerId })]);

  const term = q ? normalize(q.trim()) : '';
  const visible = term ? deals.filter((deal) => matches(deal, term)) : deals;

  return stages.map((stage) => {
    const columnDeals = visible
      .filter((deal) => deal.stageId === stage.id)
      .sort((a, b) => a.position - b.position);
    return {
      stage,
      deals: columnDeals,
      count: columnDeals.length,
      total: columnDeals.reduce((sum, deal) => sum + deal.value, 0),
    };
  });
}
