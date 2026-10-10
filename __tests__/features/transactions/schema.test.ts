import {
  formValuesToNewTransaction,
  transactionFormSchema,
} from '@/features/transactions/schema';
import { getTodayLocalDate } from '@/lib/dates';

describe('Transaction form schema validation', () => {
  const validData = {
    type: 'expense' as const,
    amount: '45.50',
    categoryId: 1,
    date: getTodayLocalDate(),
    note: 'Groceries at supermarket',
  };

  it('validates correct transaction form data', () => {
    const result = transactionFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects zero or negative amounts', () => {
    expect(
      transactionFormSchema.safeParse({ ...validData, amount: '0' }).success,
    ).toBe(false);
    expect(
      transactionFormSchema.safeParse({ ...validData, amount: '-10.00' }).success,
    ).toBe(false);
  });

  it('rejects amounts with more than 2 decimal places', () => {
    const result = transactionFormSchema.safeParse({
      ...validData,
      amount: '12.345',
    });
    expect(result.success).toBe(false);
  });

  it('rejects amounts exceeding 999,999,999.99', () => {
    const result = transactionFormSchema.safeParse({
      ...validData,
      amount: '1000000000.00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects future dates', () => {
    const result = transactionFormSchema.safeParse({
      ...validData,
      date: '2099-12-31',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date formats', () => {
    const result = transactionFormSchema.safeParse({
      ...validData,
      date: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('rejects notes longer than 140 characters', () => {
    const longNote = 'a'.repeat(141);
    const result = transactionFormSchema.safeParse({
      ...validData,
      note: longNote,
    });
    expect(result.success).toBe(false);
  });

  it('correctly maps form values to database model in cents', () => {
    const parsed = transactionFormSchema.parse(validData);
    const dbPayload = formValuesToNewTransaction(parsed);

    expect(dbPayload.type).toBe('expense');
    expect(dbPayload.amount_cents).toBe(4550);
    expect(dbPayload.category_id).toBe(1);
    expect(dbPayload.note).toBe('Groceries at supermarket');
    expect(dbPayload.date).toBe(validData.date);
  });

  it('correctly validates and maps income transactions', () => {
    const incomeData = {
      type: 'income' as const,
      amount: '2500.00',
      categoryId: 1, // Salary
      date: getTodayLocalDate(),
      note: 'Monthly salary payout',
    };
    const parsed = transactionFormSchema.parse(incomeData);
    const dbPayload = formValuesToNewTransaction(parsed);

    expect(dbPayload.type).toBe('income');
    expect(dbPayload.amount_cents).toBe(250000);
    expect(dbPayload.category_id).toBe(1);
    expect(dbPayload.note).toBe('Monthly salary payout');
  });
});

