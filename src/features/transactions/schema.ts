import { z } from 'zod';
import { getTodayLocalDate, isValidLocalDate } from '@/lib/dates';
import { parseCentsFromString } from '@/lib/money';
import { NewTransaction } from '@/db/types';

export const transactionFormSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z
    .string()
    .trim()
    .min(1, 'Amount is required')
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val), {
      message: 'Enter a valid amount with up to 2 decimal places',
    })
    .refine((val) => {
      const cents = parseCentsFromString(val);
      return cents > 0;
    }, {
      message: 'Amount must be greater than zero',
    })
    .refine((val) => {
      const cents = parseCentsFromString(val);
      // Max 999,999,999.99 = 99,999,999,999 cents
      return cents <= 99999999999;
    }, {
      message: 'Amount exceeds maximum permitted limit',
    }),
  categoryId: z.number().positive('Please select a category'),
  date: z
    .string()
    .min(1, 'Date is required')
    .refine(isValidLocalDate, {
      message: 'Please enter a valid date in YYYY-MM-DD format',
    })
    .refine((val) => val <= getTodayLocalDate(), {
      message: 'Transaction date cannot be in the future',
    }),
  note: z.string().max(140, 'Note cannot exceed 140 characters'),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export function formValuesToNewTransaction(
  values: TransactionFormValues,
): NewTransaction {
  return {
    type: values.type,
    amount_cents: parseCentsFromString(values.amount),
    category_id: values.categoryId,
    note: values.note ? values.note.trim() : null,
    date: values.date,
  };
}
