import { db } from '@/db';
import { users, contributions, loans } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';

export interface LoanEligibility {
  eligible: boolean;
  maxAmount: number;
  minCreditScore: number;
  currentCreditScore: number;
  contributionHistory: number;
  reasons: string[];
}

export interface LoanDetails {
  amount: number;
  termMonths: number;
  interestRate: number;
  monthlyPayment: number;
  totalPayable: number;
  totalInterest: number;
}

export class LoanCalculatorService {
  private static readonly MIN_CONTRIBUTION_MONTHS = 6;
  private static readonly LOAN_MULTIPLIER = 3;
  private static readonly MIN_CREDIT_SCORE = 400;

  static async calculateEligibility(userId: number): Promise<LoanEligibility> {
    try {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user.length) {
        return {
          eligible: false,
          maxAmount: 0,
          minCreditScore: this.MIN_CREDIT_SCORE,
          currentCreditScore: 0,
          contributionHistory: 0,
          reasons: ['User not found']
        };
      }

      const userContributions = await db
        .select()
        .from(contributions)
        .where(and(eq(contributions.userId, userId), eq(contributions.status, 'completed')));

      const userLoans = await db
        .select()
        .from(loans)
        .where(eq(loans.userId, userId));

      const activeLoans = userLoans.filter(l => l.status === 'disbursed' && parseFloat(l.remainingBalance) > 0);
      
      const reasons: string[] = [];
      let eligible = true;

      // Check contribution history
      const contributionMonths = this.getContributionMonths(userContributions);
      if (contributionMonths < this.MIN_CONTRIBUTION_MONTHS) {
        eligible = false;
        reasons.push(`Need at least ${this.MIN_CONTRIBUTION_MONTHS} months of contributions (current: ${contributionMonths})`);
      }

      // Check credit score
      if (user[0].creditScore < this.MIN_CREDIT_SCORE) {
        eligible = false;
        reasons.push(`Credit score too low (minimum: ${this.MIN_CREDIT_SCORE})`);
      }

      // Check for active loans
      if (activeLoans.length >= 2) {
        eligible = false;
        reasons.push('Maximum of 2 active loans allowed');
      }

      // Check for recent defaults
      const recentDefaults = userLoans.filter(l => 
        l.status === 'rejected' && 
        new Date(l.applicationDate) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      );
      
      if (recentDefaults.length > 0) {
        eligible = false;
        reasons.push('Recent loan rejection found');
      }

      // Calculate maximum loan amount
      const totalContributions = userContributions.reduce((sum, c) => sum + parseFloat(c.amount), 0);
      const maxAmount = eligible ? totalContributions * this.LOAN_MULTIPLIER : 0;

      if (eligible) {
        reasons.push('Congratulations! You are eligible for a loan');
      }

      return {
        eligible,
        maxAmount,
        minCreditScore: this.MIN_CREDIT_SCORE,
        currentCreditScore: user[0].creditScore,
        contributionHistory: contributionMonths,
        reasons
      };
    } catch (error) {
      console.error('Error calculating loan eligibility:', error);
      return {
        eligible: false,
        maxAmount: 0,
        minCreditScore: this.MIN_CREDIT_SCORE,
        currentCreditScore: 0,
        contributionHistory: 0,
        reasons: ['Error calculating eligibility']
      };
    }
  }

  static calculateInterestRate(creditScore: number): number {
    // Interest rate based on credit score (annual percentage)
    if (creditScore >= 750) return 8.0;   // Excellent
    if (creditScore >= 700) return 10.0;  // Very Good
    if (creditScore >= 650) return 12.0;  // Good
    if (creditScore >= 600) return 14.0;  // Fair
    return 16.0; // Poor
  }

  static calculateLoanDetails(amount: number, termMonths: number, creditScore: number): LoanDetails {
    const annualRate = this.calculateInterestRate(creditScore);
    const monthlyRate = annualRate / 100 / 12;
    
    // Calculate monthly payment using loan payment formula
    const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                          (Math.pow(1 + monthlyRate, termMonths) - 1);
    
    const totalPayable = monthlyPayment * termMonths;
    const totalInterest = totalPayable - amount;

    return {
      amount,
      termMonths,
      interestRate: annualRate,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalPayable: Math.round(totalPayable * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100
    };
  }

  private static getContributionMonths(contributions: any[]): number {
    if (contributions.length === 0) return 0;

    const monthlyContributions = contributions.reduce((months, contribution) => {
      const date = new Date(contribution.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      months.add(key);
      return months;
    }, new Set<string>());

    return monthlyContributions.size;
  }
}