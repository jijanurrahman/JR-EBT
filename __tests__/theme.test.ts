import { lightColors, darkColors, spacing, radii } from '@/theme';

describe('Theme tokens', () => {
  it('defines light and dark colors with required semantics', () => {
    expect(lightColors.primary).toBeDefined();
    expect(lightColors.income).toBeDefined();
    expect(lightColors.expense).toBeDefined();
    expect(lightColors.warning).toBeDefined();
    expect(lightColors.danger).toBeDefined();

    expect(darkColors.primary).toBeDefined();
    expect(darkColors.income).toBeDefined();
    expect(darkColors.expense).toBeDefined();
    expect(darkColors.warning).toBeDefined();
    expect(darkColors.danger).toBeDefined();
  });

  it('provides scale values for spacing and radii', () => {
    expect(spacing.sm).toBe(8);
    expect(spacing.md).toBe(12);
    expect(spacing.lg).toBe(16);
    expect(radii.full).toBe(9999);
  });
});

