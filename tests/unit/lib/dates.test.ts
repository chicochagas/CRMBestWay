import { describe, expect, it } from 'vitest';
import { addDays, daysOverdue, isAfter, todayInSaoPaulo } from '@/lib/dates';

describe('todayInSaoPaulo', () => {
  it('usa o fuso de São Paulo, não UTC (virada do dia)', () => {
    // 02:30 UTC de 30/09 ainda é 23:30 de 29/09 em São Paulo (UTC-3).
    expect(todayInSaoPaulo(new Date('2026-09-30T02:30:00Z'))).toBe('2026-09-29');
    expect(todayInSaoPaulo(new Date('2026-09-30T03:30:00Z'))).toBe('2026-09-30');
  });
});

describe('daysOverdue', () => {
  it('é 0 para hoje e para o futuro', () => {
    expect(daysOverdue('2026-10-01', '2026-10-01')).toBe(0);
    expect(daysOverdue('2026-10-05', '2026-10-01')).toBe(0);
  });

  it('conta os dias de atraso, atravessando o mês', () => {
    expect(daysOverdue('2026-09-28', '2026-10-01')).toBe(3);
  });
});

describe('isAfter / addDays', () => {
  it('compara datas de calendário', () => {
    expect(isAfter('2026-10-02', '2026-10-01')).toBe(true);
    expect(isAfter('2026-10-01', '2026-10-01')).toBe(false);
    expect(addDays('2026-09-29', 5)).toBe('2026-10-04');
  });
});
