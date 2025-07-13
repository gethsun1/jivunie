import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CreditScoringService } from '@/lib/services/credit-scoring';

// Mock database
jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
    update: jest.fn(),
    insert: jest.fn(),
  },
}));

describe('CreditScoringService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateInterestRate', () => {
    it('should return 8% for excellent credit score (750+)', () => {
      expect(CreditScoringService.calculateInterestRate(800)).toBe(8.0);
      expect(CreditScoringService.calculateInterestRate(750)).toBe(8.0);
    });

    it('should return 10% for very good credit score (700-749)', () => {
      expect(CreditScoringService.calculateInterestRate(725)).toBe(10.0);
      expect(CreditScoringService.calculateInterestRate(700)).toBe(10.0);
    });

    it('should return 12% for good credit score (650-699)', () => {
      expect(CreditScoringService.calculateInterestRate(675)).toBe(12.0);
      expect(CreditScoringService.calculateInterestRate(650)).toBe(12.0);
    });

    it('should return 14% for fair credit score (600-649)', () => {
      expect(CreditScoringService.calculateInterestRate(625)).toBe(14.0);
      expect(CreditScoringService.calculateInterestRate(600)).toBe(14.0);
    });

    it('should return 16% for poor credit score (below 600)', () => {
      expect(CreditScoringService.calculateInterestRate(550)).toBe(16.0);
      expect(CreditScoringService.calculateInterestRate(300)).toBe(16.0);
    });
  });

  describe('getCreditScoreCategory', () => {
    it('should categorize excellent scores correctly', () => {
      const result = CreditScoringService.getCreditScoreCategory(800);
      expect(result.category).toBe('Excellent');
      expect(result.color).toBe('green');
      expect(result.description).toBe('Outstanding credit management');
    });

    it('should categorize very good scores correctly', () => {
      const result = CreditScoringService.getCreditScoreCategory(725);
      expect(result.category).toBe('Very Good');
      expect(result.color).toBe('blue');
    });

    it('should categorize good scores correctly', () => {
      const result = CreditScoringService.getCreditScoreCategory(675);
      expect(result.category).toBe('Good');
      expect(result.color).toBe('yellow');
    });

    it('should categorize fair scores correctly', () => {
      const result = CreditScoringService.getCreditScoreCategory(625);
      expect(result.category).toBe('Fair');
      expect(result.color).toBe('orange');
    });

    it('should categorize poor scores correctly', () => {
      const result = CreditScoringService.getCreditScoreCategory(550);
      expect(result.category).toBe('Poor');
      expect(result.color).toBe('red');
      expect(result.description).toBe('Needs improvement');
    });
  });
});