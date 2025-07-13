import { describe, it, expect } from '@jest/globals';
import { LoanCalculatorService } from '@/lib/services/loan-calculator';

describe('LoanCalculatorService', () => {
  describe('calculateInterestRate', () => {
    it('should calculate correct interest rates for different credit scores', () => {
      expect(LoanCalculatorService.calculateInterestRate(800)).toBe(8.0);
      expect(LoanCalculatorService.calculateInterestRate(750)).toBe(8.0);
      expect(LoanCalculatorService.calculateInterestRate(725)).toBe(10.0);
      expect(LoanCalculatorService.calculateInterestRate(700)).toBe(10.0);
      expect(LoanCalculatorService.calculateInterestRate(675)).toBe(12.0);
      expect(LoanCalculatorService.calculateInterestRate(650)).toBe(12.0);
      expect(LoanCalculatorService.calculateInterestRate(625)).toBe(14.0);
      expect(LoanCalculatorService.calculateInterestRate(600)).toBe(14.0);
      expect(LoanCalculatorService.calculateInterestRate(550)).toBe(16.0);
    });
  });

  describe('calculateLoanDetails', () => {
    it('should calculate loan details correctly', () => {
      const result = LoanCalculatorService.calculateLoanDetails(100000, 12, 700);
      
      expect(result.amount).toBe(100000);
      expect(result.termMonths).toBe(12);
      expect(result.interestRate).toBe(10.0);
      expect(result.monthlyPayment).toBeGreaterThan(8000);
      expect(result.totalPayable).toBeGreaterThan(100000);
      expect(result.totalInterest).toBeGreaterThan(0);
      expect(result.totalPayable).toBe(result.monthlyPayment * 12);
      expect(result.totalInterest).toBe(result.totalPayable - result.amount);
    });

    it('should handle different loan amounts and terms', () => {
      const result1 = LoanCalculatorService.calculateLoanDetails(50000, 6, 750);
      const result2 = LoanCalculatorService.calculateLoanDetails(200000, 24, 600);
      
      expect(result1.amount).toBe(50000);
      expect(result1.termMonths).toBe(6);
      expect(result1.interestRate).toBe(8.0);
      
      expect(result2.amount).toBe(200000);
      expect(result2.termMonths).toBe(24);
      expect(result2.interestRate).toBe(14.0);
      
      // Higher credit score should result in lower interest
      expect(result1.interestRate).toBeLessThan(result2.interestRate);
    });
  });
});