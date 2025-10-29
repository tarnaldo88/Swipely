import { formatters } from '../index';

describe('Formatters', () => {
  describe('currency formatter', () => {
    it('should format USD currency correctly', () => {
      expect(formatters.currency(99.99)).toBe('$99.99');
      expect(formatters.currency(1000)).toBe('$1,000.00');
      expect(formatters.currency(0)).toBe('$0.00');
    });

    it('should format different currencies', () => {
      expect(formatters.currency(99.99, 'EUR')).toBe('€99.99');
      expect(formatters.currency(99.99, 'GBP')).toBe('£99.99');
    });

    it('should handle decimal values correctly', () => {
      expect(formatters.currency(99.999)).toBe('$100.00');
      expect(formatters.currency(99.001)).toBe('$99.00');
    });
  });

  describe('date formatter', () => {
    it('should format dates correctly', () => {
      const testDate = new Date('2024-01-15');
      const formatted = formatters.date(testDate);
      expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should handle different date objects', () => {
      const today = new Date();
      const formatted = formatters.date(today);
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });
  });
});