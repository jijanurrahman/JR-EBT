import { z } from 'zod';
import { parseCentsFromString } from '@/lib/money';

export const budgetFormSchema = z.object({
  categoryId: z.number().positive('Please select a category'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid month format'),
  limit: z
    .string()
    .trim()
    .min(1, 'Budget limit is required')
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val), {
      message: 'Enter a valid amount with up to 2 decimal places',
    })
    .refine((val) => {
      const cents = parseCentsFromString(val);
      return cents > 0;
    }, {
      message: 'Budget limit must be greater than zero',
    })
    .refine((val) => {
      const cents = parseCentsFromString(val);
      return cents <= 99999999999;
    }, {
      message: 'Budget limit exceeds maximum permitted limit',
    }),
});

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;

