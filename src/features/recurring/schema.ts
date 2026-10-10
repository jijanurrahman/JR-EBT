import { z } from 'zod';
import { parseCentsFromString } from '@/lib/money';
import { isValidLocalDate } from '@/lib/dates';
import { NewRecurringRule, RecurrenceFrequency } from '@/db/types';

export const recurringRuleFormSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z
    .string()
    .trim()
    .min(1, 'Amount is required')
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val), {
      message: 'Enter a valid amount with up to 2 decimal places',
    })
    .refine((val) => parseCentsFromString(val) > 0, {
      message: 'Amount must be greater than zero',
    }),
  categoryId: z.number().positive('Please select a category'),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  startDate: z
    .string()
    .min(1, 'Start date is required')
    .refine(isValidLocalDate, {
      message: 'Enter a valid date (YYYY-MM-DD)',
    }),
  note: z.string().max(140, 'Note cannot exceed 140 characters'),
});

export type RecurringRuleFormValues = z.infer<typeof recurringRuleFormSchema>;

export function formValuesToNewRecurringRule(
  values: RecurringRuleFormValues,
): NewRecurringRule {
  return {
    type: values.type,
    amount_cents: parseCentsFromString(values.amount),
    category_id: values.categoryId,
    frequency: values.frequency as RecurrenceFrequency,
    interval: 1,
    start_date: values.startDate,
    end_date: null,
    note: values.note ? values.note.trim() : null,
    active: 1,
  };
}

