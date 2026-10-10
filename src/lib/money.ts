/**
 * Converts a decimal string representation of currency to minor units (integer cents).
 * Avoids IEEE 754 float precision loss by parsing integer portions directly.
 */
export function parseCentsFromString(input: string): number {
  if (!input) return 0;

  // Strip currency symbols, spaces, and commas
  const cleaned = input.replace(/[^0-9.-]/g, '').trim();
  if (!cleaned || cleaned === '-' || cleaned === '.') return 0;

  const isNegative = cleaned.startsWith('-');
  const unsigned = isNegative ? cleaned.slice(1) : cleaned;

  const parts = unsigned.split('.');
  const wholePart = parts[0] || '0';
  const decimalPart = parts[1] || '';

  const wholeCents = parseInt(wholePart, 10) * 100;
  if (isNaN(wholeCents)) return 0;

  // Pad or truncate to 2 digits
  const paddedDecimal = (decimalPart + '00').slice(0, 2);
  const fracCents = parseInt(paddedDecimal, 10);
  if (isNaN(fracCents)) return 0;

  const totalCents = wholeCents + fracCents;
  return isNegative ? -totalCents : totalCents;
}

/**
 * Formats integer cents into a fixed 2-decimal string like "12.34" or "0.05".
 */
export function centsToDecimalString(cents: number): string {
  const isNegative = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;

  const formatted = `${dollars}.${remainder.toString().padStart(2, '0')}`;
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Formats integer cents into a localized currency string using Intl.NumberFormat.
 */
export function formatCents(
  cents: number,
  currencyCode = 'USD',
  locale = 'en-US',
): string {
  const decimalValue = cents / 100;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(decimalValue);
  } catch {
    // Fallback if locale or currency code is unsupported
    const sign = cents < 0 ? '-' : '';
    return `${sign}$${centsToDecimalString(Math.abs(cents))}`;
  }
}

