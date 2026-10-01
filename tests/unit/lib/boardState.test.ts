import { describe, expect, it } from 'vitest';
import type { DealCard } from '@/lib/domain';
import { findContainer, moveAcross, reorderWithin, serverIndex } from '@/lib/pipeline/boardState';
import { makeDeal, STAGES } from '../fakes/repositories';

function card(id: string, stageId: string, position: number): DealCard {
  return {
    ...makeDeal({ id, stageId, position }),
    contact: { id: 'c', name: 'C', email: 'c@x.com', phone: null, origem: 'inbound' },
    company: null,
    owner: null,
    stage: STAGES.find((stage) => stage.id === stageId)!,
  };
}

const board = () => ({
  a: [card('a1', 'a', 0), card('a2', 'a', 1), card('a3', 'a', 2)],
  b: [card('b1', 'b', 0)],
  c: [],
});

describe('boardState', () => {
  it('encontra a coluna do card ou da própria coluna', () => {
    expect(findContainer(board(), 'a2')).toBe('a');
    expect(findContainer(board(), 'c')).toBe('c');
  });

  it('move para outra coluna antes do card de destino, ou no fim da coluna vazia', () => {
    const moved = moveAcross(board(), 'a3', 'b1');
    expect(moved.b?.map((d) => d.id)).toEqual(['a3', 'b1']);
    expect(moved.a?.map((d) => d.id)).toEqual(['a1', 'a2']);
    expect(moveAcross(board(), 'a1', 'c').c?.map((d) => d.id)).toEqual(['a1']);
  });

  it('reordena dentro da coluna', () => {
    expect(reorderWithin(board(), 'a3', 'a1').a?.map((d) => d.id)).toEqual(['a3', 'a1', 'a2']);
  });

  it('sem filtro, o índice é o visível', () => {
    expect(serverIndex([card('x', 'a', 0), card('y', 'b', 5)], 'y', false)).toBe(1);
  });

  it('com filtro, usa a posição real do vizinho visível', () => {
    // Vizinho visível na posição 7 da coluna completa → entra logo depois (8).
    expect(serverIndex([card('n', 'b', 7), card('m', 'a', 2)], 'm', true)).toBe(8);
    // Mesma coluna, vindo de antes do vizinho: a remoção desloca o vizinho em 1.
    expect(serverIndex([card('n', 'b', 7), card('m', 'b', 3)], 'm', true)).toBe(7);
    // Só vizinho depois: ocupa a posição dele.
    expect(serverIndex([card('m', 'a', 9), card('n', 'b', 4)], 'm', true)).toBe(4);
  });
});
