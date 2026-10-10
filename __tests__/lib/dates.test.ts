import {
  getTodayLocalDate,
  getCurrentMonth,
  formatLocalDate,
  parseLocalDate,
  isValidLocalDate,
  formatDisplayDate,
  formatDisplayMonth,
  getPreviousMonth,
  getNextMonth,
} from '@/lib/dates';

describe('Date utility', () => {
  it('returns valid today local date in YYYY-MM-DD format', () => {
    const today = getTodayLocalDate();
    expect(/^\d{4}-\d{2}-\d{2}$/.test(today)).toBe(true);
    expect(isValidLocalDate(today)).toBe(true);
  });

  it('returns current month in YYYY-MM format', () => {
    const currentMonth = getCurrentMonth();
    expect(/^\d{4}-\d{2}$/.test(currentMonth)).toBe(true);
  });

  it('formats Date instance to YYYY-MM-DD', () => {
    const date = new Date(2026, 9, 10); // Oct 10, 2026
    expect(formatLocalDate(date)).toBe('2026-10-10');
  });

  it('parses local date string correctly', () => {
    const parsed = parseLocalDate('2026-10-10');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(9); // 0-indexed October
    expect(parsed.getDate()).toBe(10);
  });

  it('validates local date strings', () => {
    expect(isValidLocalDate('2026-10-10')).toBe(true);
    expect(isValidLocalDate('2026-02-28')).toBe(true);
    expect(isValidLocalDate('invalid-date')).toBe(false);
    expect(isValidLocalDate('2026/10/10')).toBe(false);
  });

  it('formats display date and month', () => {
    expect(formatDisplayDate('2026-10-10')).toBe('Oct 10, 2026');
    expect(formatDisplayMonth('2026-10')).toBe('October 2026');
  });

  it('computes previous and next months correctly across years', () => {
    expect(getPreviousMonth('2026-01')).toBe('2025-12');
    expect(getNextMonth('2025-12')).toBe('2026-01');
    expect(getPreviousMonth('2026-10')).toBe('2026-09');
    expect(getNextMonth('2026-10')).toBe('2026-11');
  });
});

