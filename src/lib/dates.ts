import { format, parse, isValid, addMonths, subMonths } from 'date-fns';

export function getTodayLocalDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function formatLocalDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseLocalDate(dateStr: string): Date {
  return parse(dateStr, 'yyyy-MM-dd', new Date());
}

export function isValidLocalDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
  return isValid(parsed);
}

export function formatDisplayDate(dateStr: string): string {
  try {
    const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
    if (!isValid(parsed)) return dateStr;
    return format(parsed, 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatDisplayMonth(monthStr: string): string {
  try {
    const parsed = parse(`${monthStr}-01`, 'yyyy-MM-dd', new Date());
    if (!isValid(parsed)) return monthStr;
    return format(parsed, 'MMMM yyyy');
  } catch {
    return monthStr;
  }
}

export function getPreviousMonth(monthStr: string): string {
  const parsed = parse(`${monthStr}-01`, 'yyyy-MM-dd', new Date());
  return format(subMonths(parsed, 1), 'yyyy-MM');
}

export function getNextMonth(monthStr: string): string {
  const parsed = parse(`${monthStr}-01`, 'yyyy-MM-dd', new Date());
  return format(addMonths(parsed, 1), 'yyyy-MM');
}

/** Short label for charts, e.g. "Oct" */
export function formatShortMonth(monthStr: string): string {
  try {
    const parsed = parse(`${monthStr}-01`, 'yyyy-MM-dd', new Date());
    if (!isValid(parsed)) return monthStr;
    return format(parsed, 'MMM');
  } catch {
    return monthStr;
  }
}

/** Returns the last N months as 'YYYY-MM' strings, ending with the given month */
export function getLastNMonths(month: string, count: number): string[] {
  const result: string[] = [];
  let current = month;
  for (let i = 0; i < count; i++) {
    result.unshift(current);
    current = getPreviousMonth(current);
  }
  return result;
}
