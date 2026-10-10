import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  format,
  parse,
  isBefore,
  isEqual,
} from 'date-fns';
import { RecurrenceFrequency } from '@/db/types';

export function getNextOccurrenceDate(
  currentDateStr: string,
  frequency: RecurrenceFrequency,
  interval = 1,
): string {
  const current = parse(currentDateStr, 'yyyy-MM-dd', new Date());
  let next: Date;

  switch (frequency) {
    case 'daily':
      next = addDays(current, interval);
      break;
    case 'weekly':
      next = addWeeks(current, interval);
      break;
    case 'monthly':
      next = addMonths(current, interval);
      break;
    case 'yearly':
      next = addYears(current, interval);
      break;
  }

  return format(next, 'yyyy-MM-dd');
}

export function getDueDatesForRule(
  startDateStr: string,
  lastGeneratedStr: string | null,
  endDateStr: string | null,
  targetDateStr: string,
  frequency: RecurrenceFrequency,
  interval = 1,
): string[] {
  const dueDates: string[] = [];
  const targetDate = parse(targetDateStr, 'yyyy-MM-dd', new Date());
  const endDate = endDateStr ? parse(endDateStr, 'yyyy-MM-dd', new Date()) : null;

  let candidate = lastGeneratedStr
    ? getNextOccurrenceDate(lastGeneratedStr, frequency, interval)
    : startDateStr;

  while (true) {
    const candidateDate = parse(candidate, 'yyyy-MM-dd', new Date());

    if (endDate && isBefore(endDate, candidateDate)) {
      break;
    }

    if (isBefore(targetDate, candidateDate)) {
      break;
    }

    if (isEqual(candidateDate, targetDate) || isBefore(candidateDate, targetDate)) {
      dueDates.push(candidate);
    }

    candidate = getNextOccurrenceDate(candidate, frequency, interval);
  }

  return dueDates;
}

