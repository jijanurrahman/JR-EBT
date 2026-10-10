import {
  categoryFormSchema,
  formValuesToNewCategory,
} from '@/features/categories/schema';

describe('Category form schema validation', () => {
  const validData = {
    name: 'Groceries',
    type: 'expense' as const,
    color: '#0D9488',
    icon: 'restaurant-outline',
  };

  it('validates correct category data', () => {
    const result = categoryFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects empty or whitespace-only names', () => {
    expect(categoryFormSchema.safeParse({ ...validData, name: '' }).success).toBe(
      false,
    );
    expect(
      categoryFormSchema.safeParse({ ...validData, name: '   ' }).success,
    ).toBe(false);
  });

  it('rejects names longer than 30 characters', () => {
    const longName = 'a'.repeat(31);
    expect(
      categoryFormSchema.safeParse({ ...validData, name: longName }).success,
    ).toBe(false);
  });

  it('rejects invalid hex colors', () => {
    expect(
      categoryFormSchema.safeParse({ ...validData, color: 'red' }).success,
    ).toBe(false);
    expect(
      categoryFormSchema.safeParse({ ...validData, color: '#12345' }).success,
    ).toBe(false);
  });

  it('maps form values to new category entity', () => {
    const parsed = categoryFormSchema.parse(validData);
    const result = formValuesToNewCategory(parsed);

    expect(result.name).toBe('Groceries');
    expect(result.type).toBe('expense');
    expect(result.color).toBe('#0D9488');
    expect(result.icon).toBe('restaurant-outline');
    expect(result.archived).toBe(0);
  });
});

