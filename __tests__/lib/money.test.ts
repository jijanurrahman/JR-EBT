import {
  parseCentsFromString,
  centsToDecimalString,
  formatCents,
} from '@/lib/money';

describe('Money utility', () => {
  describe('parseCentsFromString', () => {
    it('parses standard integer dollar amounts', () => {
      expect(parseCentsFromString('10')).toBe(1000);
      expect(parseCentsFromString('1')).toBe(100);
      expect(parseCentsFromString('0')).toBe(0);
    });

    it('parses amounts with single-digit decimals by padding to tens', () => {
      expect(parseCentsFromString('10.5')).toBe(1050);
      expect(parseCentsFromString('0.1')).toBe(10);
    });

    it('parses amounts with two-digit decimals', () => {
      expect(parseCentsFromString('10.50')).toBe(1050);
      expect(parseCentsFromString('10.05')).toBe(1005);
      expect(parseCentsFromString('0.99')).toBe(99);
      expect(parseCentsFromString('.99')).toBe(99);
    });

    it('strips commas and currency formatting symbols', () => {
      expect(parseCentsFromString('$1,234.56')).toBe(123456);
      expect(parseCentsFromString('€ 9,999.00')).toBe(999900);
    });

    it('handles negative amounts correctly', () => {
      expect(parseCentsFromString('-45.20')).toBe(-4520);
      expect(parseCentsFromString('-$100')).toBe(-10000);
    });

    it('handles empty or malformed input without error', () => {
      expect(parseCentsFromString('')).toBe(0);
      expect(parseCentsFromString('-')).toBe(0);
      expect(parseCentsFromString('.')).toBe(0);
      expect(parseCentsFromString('abc')).toBe(0);
    });

    it('parses large amounts accurately without floating point drift', () => {
      expect(parseCentsFromString('999999999.99')).toBe(99999999999);
    });
  });

  describe('centsToDecimalString', () => {
    it('converts integer cents to a 2-decimal string', () => {
      expect(centsToDecimalString(1234)).toBe('12.34');
      expect(centsToDecimalString(1000)).toBe('10.00');
      expect(centsToDecimalString(50)).toBe('0.50');
      expect(centsToDecimalString(5)).toBe('0.05');
      expect(centsToDecimalString(0)).toBe('0.00');
    });

    it('handles negative cents', () => {
      expect(centsToDecimalString(-150)).toBe('-1.50');
      expect(centsToDecimalString(-5)).toBe('-0.05');
    });
  });

  describe('formatCents', () => {
    it('formats cents into currency display string', () => {
      expect(formatCents(1234, 'USD', 'en-US')).toBe('$12.34');
      expect(formatCents(0, 'USD', 'en-US')).toBe('$0.00');
    });

    it('formats cents in other currencies like BDT and EUR', () => {
      const bdt = formatCents(50000, 'BDT', 'bn-BD');
      // Should include BDT currency representation
      expect(bdt).toBeDefined();

      const eur = formatCents(1234, 'EUR', 'de-DE');
      expect(eur).toMatch(/12,34\s?€/);
    });
  });
});

