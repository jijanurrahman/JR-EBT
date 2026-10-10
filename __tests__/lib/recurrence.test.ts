import { getNextOccurrenceDate, getDueDatesForRule } from '@/lib/recurrence';

describe('Recurrence date engine', () => {
  it('calculates daily next occurrences', () => {
    expect(getNextOccurrenceDate('2026-10-01', 'daily', 1)).toBe('2026-10-02');
    expect(getNextOccurrenceDate('2026-10-01', 'daily', 3)).toBe('2026-10-04');
  });

  it('calculates weekly next occurrences', () => {
    expect(getNextOccurrenceDate('2026-10-01', 'weekly', 1)).toBe('2026-10-08');
  });

  it('calculates monthly next occurrences', () => {
    expect(getNextOccurrenceDate('2026-10-01', 'monthly', 1)).toBe('2026-11-01');
  });

  it('calculates yearly next occurrences', () => {
    expect(getNextOccurrenceDate('2026-10-01', 'yearly', 1)).toBe('2027-10-01');
  });

  it('finds all due dates between start and target date', () => {
    const dueDates = getDueDatesForRule(
      '2026-10-01',
      null,
      null,
      '2026-10-04',
      'daily',
      1,
    );
    expect(dueDates).toEqual([
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
    ]);
  });

  it('respects last generated date to avoid duplicates', () => {
    const dueDates = getDueDatesForRule(
      '2026-10-01',
      '2026-10-02',
      null,
      '2026-10-04',
      'daily',
      1,
    );
    expect(dueDates).toEqual(['2026-10-03', '2026-10-04']);
  });
});

