import { describe, expect, it } from 'vitest';
import type { Deal, Origem } from '@/lib/domain';
import { validateTransition, type TransitionInput } from '@/lib/services/deals/transitions';
import { STAGES } from '../fakes/repositories';
import { expectCode } from '../helpers';

const TODAY = '2026-10-01';
const stage = (id: string) => STAGES.find((item) => item.id === id)!;

function run(
  toStageId: string,
  input: TransitionInput = {},
  deal: Partial<Pick<Deal, 'status' | 'qualifiedAt' | 'stageId'>> = {},
  contactOrigem: Origem = 'inbound',
) {
  return validateTransition({
    deal: { status: 'open', qualifiedAt: '2026-09-01T00:00:00Z', stageId: 's-neg', ...deal },
    contactOrigem,
    toStage: stage(toStageId),
    stages: STAGES,
    today: TODAY,
    now: new Date('2026-10-01T12:00:00Z'),
    input,
  });
}

describe('Ganho (US4-1, FR-016)', () => {
  it('exige o tipo', () => expectCode(() => run('s-ganho'), 'WON_DATA_REQUIRED'));

  it('recorrente exige MRR maior que zero', async () => {
    await expectCode(() => run('s-ganho', { won: { dealType: 'recorrente' } }), 'WON_DATA_REQUIRED');
    await expectCode(() => run('s-ganho', { won: { dealType: 'recorrente', mrr: 0 } }), 'WON_DATA_REQUIRED');
    expect(run('s-ganho', { won: { dealType: 'recorrente', mrr: 3500 } })).toEqual({
      status: 'won',
      dealType: 'recorrente',
      mrr: 3500,
    });
  });

  it('pontual zera o MRR', () => {
    expect(run('s-ganho', { won: { dealType: 'pontual', mrr: 999 } })).toEqual({ status: 'won', dealType: 'pontual', mrr: 0 });
  });
});

describe('Perdido (US4-2, FR-017)', () => {
  it('exige motivo da lista padronizada', async () => {
    await expectCode(() => run('s-perdido'), 'LOST_REASON_REQUIRED');
    await expectCode(() => run('s-perdido', { lost: { reason: 'caro demais' } }), 'LOST_REASON_REQUIRED');
    expect(run('s-perdido', { lost: { reason: 'timing' } })).toEqual({ status: 'lost', lostReason: 'timing', reaquecerEm: null });
  });
});

describe('Stand-by (US4-3, FR-018)', () => {
  it('exige data de reaquecer futura', async () => {
    await expectCode(() => run('s-standby'), 'STANDBY_DATE_REQUIRED');
    await expectCode(() => run('s-standby', { standby: { reaquecerEm: TODAY } }), 'STANDBY_DATE_REQUIRED');
    await expectCode(() => run('s-standby', { standby: { reaquecerEm: '2026-09-15' } }), 'STANDBY_DATE_REQUIRED');
    expect(run('s-standby', { standby: { reaquecerEm: '2026-11-01' } })).toEqual({
      status: 'standby',
      reaquecerEm: '2026-11-01',
      lostReason: null,
    });
  });
});

describe('Gate "Qualificado" (US4-4, FR-019)', () => {
  const unqualified = { qualifiedAt: null, stageId: 's-novo' };

  it('bloqueia outbound não qualificado em Diagnóstico agendado, etapas posteriores e Ganho', async () => {
    await expectCode(() => run('s-diag', {}, unqualified, 'outbound'), 'QUALIFICATION_REQUIRED');
    await expectCode(() => run('s-neg', {}, unqualified, 'outbound'), 'QUALIFICATION_REQUIRED');
    await expectCode(() => run('s-ganho', { won: { dealType: 'pontual' } }, unqualified, 'outbound'), 'QUALIFICATION_REQUIRED');
  });

  it('permite Qualificado, Perdido e Stand-by para outbound não qualificado', () => {
    expect(run('s-qual', {}, unqualified, 'outbound')).toEqual({ qualifiedAt: '2026-10-01T12:00:00.000Z' });
    expect(run('s-perdido', { lost: { reason: 'sumiu' } }, unqualified, 'outbound').status).toBe('lost');
    expect(run('s-standby', { standby: { reaquecerEm: '2026-12-01' } }, unqualified, 'outbound').status).toBe('standby');
  });

  it('não se aplica a inbound', () => {
    expect(run('s-diag', {}, unqualified, 'inbound')).toEqual({});
  });
});

describe('Reabrir (US4-6)', () => {
  it('exige nova próxima ação com data e limpa os dados de desfecho', async () => {
    const lost = { status: 'lost' as const, stageId: 's-perdido' };
    await expectCode(() => run('s-neg', {}, lost), 'NEXT_ACTION_REQUIRED');
    await expectCode(() => run('s-neg', { reopen: { nextAction: 'Ligar' } }, lost), 'NEXT_ACTION_REQUIRED');
    expect(run('s-neg', { reopen: { nextAction: ' Ligar ', nextActionDate: '2026-10-03' } }, lost)).toEqual({
      status: 'open',
      lostReason: null,
      reaquecerEm: null,
      nextAction: 'Ligar',
      nextActionDate: '2026-10-03',
    });
  });
});

describe('Mesma coluna', () => {
  it('reordenar não exige nada', () => {
    expect(run('s-neg')).toEqual({});
  });
});
