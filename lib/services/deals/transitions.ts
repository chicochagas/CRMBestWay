// FONTE ÚNICA das regras de fechamento e do gate "Qualificado" (constituição §V).
// Função pura: recebe o estado e devolve o patch a gravar junto com a troca de etapa,
// ou lança DomainError com o dado que falta. As constraints do banco são só rede de segurança.
import { isAfter } from '@/lib/dates';
import {
  LOST_REASONS,
  STAGE_KEYS,
  type Deal,
  type DealPatch,
  type DealType,
  type LostReason,
  type Origem,
  type Stage,
} from '@/lib/domain';
import { DomainError } from '../errors';

export type TransitionInput = {
  won?: { dealType?: DealType; mrr?: number };
  lost?: { reason?: string };
  standby?: { reaquecerEm?: string };
  reopen?: { nextAction?: string; nextActionDate?: string };
};

export type TransitionArgs = {
  deal: Pick<Deal, 'status' | 'qualifiedAt' | 'stageId'>;
  contactOrigem: Origem;
  toStage: Stage;
  stages: Stage[];
  today: string;
  now?: Date;
  input?: TransitionInput;
};

function assertQualified({ deal, contactOrigem, toStage, stages }: TransitionArgs): void {
  if (contactOrigem !== 'outbound' || deal.qualifiedAt) return;
  if (toStage.key === STAGE_KEYS.qualificado) return;

  const gate = stages.find((stage) => stage.key === STAGE_KEYS.diagnosticoAgendado);
  const blocked =
    toStage.kind === 'won' || (toStage.kind === 'open' && gate !== undefined && toStage.position >= gate.position);

  if (blocked) {
    throw new DomainError(
      'QUALIFICATION_REQUIRED',
      'Este deal precisa passar por "Qualificado" antes de seguir no funil.',
    );
  }
}

function wonPatch(input: TransitionInput['won']): DealPatch {
  if (!input?.dealType) {
    throw new DomainError('WON_DATA_REQUIRED', 'Informe se o contrato é pontual ou recorrente.', { field: 'dealType' });
  }
  if (input.dealType === 'recorrente') {
    if (!input.mrr || !(input.mrr > 0)) {
      throw new DomainError('WON_DATA_REQUIRED', 'Informe o MRR (maior que zero) do contrato recorrente.', {
        field: 'mrr',
      });
    }
    return { status: 'won', dealType: 'recorrente', mrr: input.mrr };
  }
  return { status: 'won', dealType: 'pontual', mrr: 0 };
}

function lostPatch(input: TransitionInput['lost']): DealPatch {
  const reason = input?.reason;
  if (!reason || !(LOST_REASONS as readonly string[]).includes(reason)) {
    throw new DomainError('LOST_REASON_REQUIRED', 'Escolha o motivo da perda.', { field: 'reason' });
  }
  return { status: 'lost', lostReason: reason as LostReason, reaquecerEm: null };
}

function standbyPatch(input: TransitionInput['standby'], today: string): DealPatch {
  const date = input?.reaquecerEm;
  if (!date || !isAfter(date, today)) {
    throw new DomainError('STANDBY_DATE_REQUIRED', 'Informe uma data futura para reaquecer o deal.', {
      field: 'reaquecerEm',
    });
  }
  return { status: 'standby', reaquecerEm: date, lostReason: null };
}

function reopenPatch(input: TransitionInput['reopen']): DealPatch {
  const nextAction = input?.nextAction?.trim();
  if (!nextAction || !input?.nextActionDate) {
    throw new DomainError('NEXT_ACTION_REQUIRED', 'Para reabrir o deal, defina a próxima ação e a data.', {
      field: 'nextAction',
    });
  }
  return {
    status: 'open',
    lostReason: null,
    reaquecerEm: null,
    nextAction,
    nextActionDate: input.nextActionDate,
  };
}

export function validateTransition(args: TransitionArgs): DealPatch {
  const { deal, toStage, today, input = {} } = args;

  // Reordenar dentro da mesma coluna não muda nada além da posição.
  if (toStage.id === deal.stageId) return {};

  assertQualified(args);

  let patch: DealPatch;
  switch (toStage.kind) {
    case 'won':
      patch = wonPatch(input.won);
      break;
    case 'lost':
      patch = lostPatch(input.lost);
      break;
    case 'standby':
      patch = standbyPatch(input.standby, today);
      break;
    case 'open':
      patch = deal.status === 'open' ? {} : reopenPatch(input.reopen);
      break;
  }

  if (toStage.key === STAGE_KEYS.qualificado && !deal.qualifiedAt) {
    patch.qualifiedAt = (args.now ?? new Date()).toISOString();
  }
  return patch;
}
