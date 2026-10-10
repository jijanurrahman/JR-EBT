import { budgetFormSchema } from '@/features/budgets/schema';

describe('Budget form schema validation', () => {
  const validData = {
    categoryId: 2,
    month: '2026-10',
    limit: '500.00',
  };

  it('validates correct budget form data', () => {
    const result = budgetFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects zero or negative budget limit', () => {
    expect(budgetFormSchema.safeParse({ ...validData, limit: '0' }).success).toBe(
      false,
    );
    expect(
      budgetFormSchema.safeParse({ ...validData, limit: '-50' }).success,
    ).toBe(false);
  });

  it('rejects invalid month format', () => {
    expect(
      budgetFormSchema.safeParse({ ...validData, month: '2026/10' }).success,
    ).toBe(false);
    expect(
      budgetFormSchema.safeParse({ ...validData, month: '2026-1' }).success,
    ).toBe(false);
  });

  it('rejects limits with more than 2 decimal places', () => {
    expect(
      budgetFormSchema.safeParse({ ...validData, limit: '500.555' }).success,
    ).toBe(false);
  });

  it('rejects non-positive category ID', () => {
    expect(
      budgetFormSchema.safeParse({ ...validData, categoryId: 0 }).success,
    ).toBe(false);
  });
});

