import { describe, it, expect } from 'vitest';
import { sortByMonthYear } from '../datetime';

describe('sortByMonthYear', () => {
  describe('Format: M Y vs M Y', () => {
    it('should return 0 for same dates', () => {
      expect(sortByMonthYear('June 2025', 'June 2025')).toBe(0);
    });

    it('should return positive for earlier vs later (descending order)', () => {
      expect(sortByMonthYear('May 2025', 'June 2025')).toBeGreaterThan(0);
    });

    it('should return negative for later vs earlier (descending order)', () => {
      expect(sortByMonthYear('June 2025', 'May 2025')).toBeLessThan(0);
    });

    it('should handle different years', () => {
      expect(sortByMonthYear('December 2024', 'January 2025')).toBeGreaterThan(0);
      expect(sortByMonthYear('January 2026', 'December 2025')).toBeLessThan(0);
    });
  });

  describe('Format: M Y vs M—M Y', () => {
    it('should compare using first month only from second parameter', () => {
      expect(sortByMonthYear('May 2025', 'June—September 2025')).toBeGreaterThan(0);
      expect(sortByMonthYear('July 2025', 'June—September 2025')).toBeLessThan(0);
    });

    it('should return 0 when first month matches', () => {
      expect(sortByMonthYear('June 2025', 'June—September 2025')).toBe(0);
    });

    it('should handle different years', () => {
      expect(sortByMonthYear('January 2025', 'December—February 2024')).toBeLessThan(0);
    });
  });

  describe('Format: M Y vs M Y—M Y', () => {
    it('should compare using first month only from second parameter', () => {
      expect(sortByMonthYear('May 2025', 'June 2025—July 2026')).toBeGreaterThan(0);
      expect(sortByMonthYear('July 2025', 'June 2025—July 2026')).toBeLessThan(0);
    });

    it('should return 0 when first month and year match', () => {
      expect(sortByMonthYear('June 2025', 'June 2025—July 2026')).toBe(0);
    });

    it('should handle cross-year ranges', () => {
      expect(sortByMonthYear('January 2025', 'December 2024—March 2025')).toBeLessThan(0);
    });
  });

  describe('Format: M—M Y vs M Y', () => {
    it('should compare using first month only from first parameter', () => {
      expect(sortByMonthYear('May—August 2025', 'June 2025')).toBeGreaterThan(0);
      expect(sortByMonthYear('July—September 2025', 'June 2025')).toBeLessThan(0);
    });

    it('should return 0 when first month matches', () => {
      expect(sortByMonthYear('June—September 2025', 'June 2025')).toBe(0);
    });

    it('should handle different years', () => {
      expect(sortByMonthYear('December—February 2024', 'January 2025')).toBeGreaterThan(0);
    });
  });

  describe('Format: M—M Y vs M—M Y', () => {
    it('should compare using first months from both parameters', () => {
      expect(sortByMonthYear('May—August 2025', 'June—September 2025')).toBeGreaterThan(0);
      expect(sortByMonthYear('July—October 2025', 'June—September 2025')).toBeLessThan(0);
    });

    it('should return 0 when first months match', () => {
      expect(sortByMonthYear('June—August 2025', 'June—December 2025')).toBe(0);
    });

    it('should handle different years', () => {
      expect(sortByMonthYear('November—January 2024', 'March—June 2025')).toBeGreaterThan(0);
    });
  });

  describe('Format: M—M Y vs M Y—M Y', () => {
    it('should compare using first months from both parameters', () => {
      expect(sortByMonthYear('May—August 2025', 'June 2025—July 2026')).toBeGreaterThan(0);
      expect(sortByMonthYear('July—September 2025', 'June 2025—July 2026')).toBeLessThan(0);
    });

    it('should return 0 when first months and years match', () => {
      expect(sortByMonthYear('June—September 2025', 'June 2025—July 2026')).toBe(0);
    });

    it('should handle cross-year scenarios', () => {
      expect(sortByMonthYear('December—February 2024', 'January 2025—March 2025')).toBeGreaterThan(0);
    });
  });

  describe('Format: M Y—M Y vs M Y', () => {
    it('should compare using first month only from first parameter', () => {
      expect(sortByMonthYear('May 2025—July 2026', 'June 2025')).toBeGreaterThan(0);
      expect(sortByMonthYear('July 2025—September 2026', 'June 2025')).toBeLessThan(0);
    });

    it('should return 0 when first month and year match', () => {
      expect(sortByMonthYear('June 2025—July 2026', 'June 2025')).toBe(0);
    });

    it('should handle cross-year ranges', () => {
      expect(sortByMonthYear('December 2024—March 2025', 'January 2025')).toBeGreaterThan(0);
    });
  });

  describe('Format: M Y—M Y vs M—M Y', () => {
    it('should compare using first months from both parameters', () => {
      expect(sortByMonthYear('May 2025—July 2026', 'June—September 2025')).toBeGreaterThan(0);
      expect(sortByMonthYear('July 2025—September 2026', 'June—August 2025')).toBeLessThan(0);
    });

    it('should return 0 when first months and years match', () => {
      expect(sortByMonthYear('June 2025—July 2026', 'June—September 2025')).toBe(0);
    });

    it('should handle different years', () => {
      expect(sortByMonthYear('January 2026—March 2026', 'December—February 2025')).toBeLessThan(0);
    });
  });

  describe('Format: M Y—M Y vs M Y—M Y', () => {
    it('should compare using first months from both parameters', () => {
      expect(sortByMonthYear('May 2025—July 2026', 'June 2025—August 2026')).toBeGreaterThan(0);
      expect(sortByMonthYear('July 2025—September 2026', 'June 2025—August 2026')).toBeLessThan(0);
    });

    it('should return 0 when first months and years match', () => {
      expect(sortByMonthYear('June 2025—July 2026', 'June 2025—December 2026')).toBe(0);
    });

    it('should handle complex cross-year scenarios', () => {
      expect(sortByMonthYear('December 2024—March 2025', 'January 2025—June 2025')).toBeGreaterThan(0);
      expect(sortByMonthYear('January 2026—March 2026', 'December 2025—February 2026')).toBeLessThan(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle single character months if any exist', () => {
      // This might not be realistic but testing robustness
      expect(() => sortByMonthYear('May 2025', 'June 2025')).not.toThrow();
    });

    it('should handle months with different cases', () => {
      // Assuming input is always properly formatted, but testing anyway
      expect(sortByMonthYear('january 2025', 'february 2025')).toBeGreaterThan(0);
    });
  });
}); 