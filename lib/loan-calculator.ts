import { LoanEligibility, User, Contribution, Loan } from '@/types';
import { db } from './database';

export class LoanCalculatorService {
  private static readonly MIN_CONTRIBUTION_MONTHS = 6;
  private static readonly LOAN_MULTIPLIER = 3;
  private static readonly MIN_CREDIT_SCORE = 400;

  static calculateEligibility(memberId: string): LoanEligibility {
    const user = db.getUserById(memberId);
    if (!user) {
      return {
        eligible: false,
        maxAmount: 0,
        minCreditScore: this.MIN_CREDIT_SCORE,
        currentCreditScore: 0,
        contributionHistory: 0,
        reasons: ['User not found']
      };
    }

    const contributions = db.getContributions(memberId).filter(c => c.status === 'completed');
    const loans = db.getLoans(memberId);
    const activeLoans = loans.filter(l => l.status === 'disbursed' && l.remainingBalance > 0);
    
    const reasons: string[] = [];
    let eligible = true;

    // Check contribution history
    const contributionMonths = this.getContributionMonths(contributions);
    if (contributionMonths < this.MIN_CONTRIBUTION_MONTHS) {
      eligible = false;
      reasons.push(`Need at least ${this.MIN_CONTRIBUTION_MONTHS} months of contributions (current: ${contributionMonths})`);
    }

    // Check credit score
    if (user.creditScore < this.MIN_CREDIT_SCORE) {
      eligible = false;
      reasons.push(`Credit score too low (minimum: ${this.MIN_CREDIT_SCORE})`);
    }

    // Check for active loans
    if (activeLoans.length >= 2) {
      eligible = false;
      reasons.push('Maximum of 2 active loans allowed');
    }

    // Check for recent defaults
    const recentDefaults = loans.filter(l => 
      l.status === 'rejected' && 
      new Date(l.applicationDate) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
    );
    
    if (recentDefaults.length > 0) {
      eligible = false;
      reasons.push('Recent loan rejection found');
    }

    // Calculate maximum loan amount
    const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);
    const maxAmount = eligible ? totalContributions * this.LOAN_MULTIPLIER : 0;

    if (eligible) {
      reasons.push('Congratulations! You are eligible for a loan');
    }

    return {
      eligible,
      maxAmount,
      minCreditScore: this.MIN_CREDIT_SCORE,
      currentCreditScore: user.creditScore,
      contributionHistory: contributionMonths,
      reasons
    };
  }

  static calculateInterestRate(creditScore: number): number {
    // Interest rate based on credit score (annual percentage)
    if (creditScore >= 750) return 8.0;   // Excellent
    if (creditScore >= 700) return 10.0;  // Very Good
    if (creditScore >= 650) return 12.0;  // Good
    if (creditScore >= 600) return 14.0;  // Fair
    return 16.0; // Poor
  }

  static calculateLoanDetails(amount: number, termMonths: number, creditScore: number) {
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

  static generatePaymentSchedule(loan: Loan): Array<{
    month: number;
    date: string;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }> {
    const schedule = [];
    const monthlyRate = loan.interestRate / 100 / 12;
    let remainingBalance = loan.amount;
    
    for (let month = 1; month <= loan.term; month++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = loan.monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;
      
      const paymentDate = new Date(loan.disbursementDate || loan.applicationDate);
      paymentDate.setMonth(paymentDate.getMonth() + month);
      
      schedule.push({
        month,
        date: paymentDate.toISOString().split('T')[0],
        payment: loan.monthlyPayment,
        principal: Math.round(principalPayment * 100) / 100,
        interest: Math.round(interestPayment * 100) / 100,
        balance: Math.max(0, Math.round(remainingBalance * 100) / 100)
      });
    }
    
    return schedule;
  }

  private static getContributionMonths(contributions: Contribution[]): number {
    if (contributions.length === 0) return 0;

    const monthlyContributions = contributions.reduce((months, contribution) => {
      const date = new Date(contribution.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      months.add(key);
      return months;
    }, new Set<string>());

    return monthlyContributions.size;
  }

  static calculateAffordability(memberId: string, loanAmount: number, termMonths: number): {
    affordable: boolean;
    monthlyIncome: number;
    debtToIncomeRatio: number;
    maxAffordablePayment: number;
    reasons: string[];
  } {
    // For demo purposes, we'll estimate monthly income based on contribution patterns
    const contributions = db.getContributions(memberId).filter(c => c.status === 'completed');
    const recentContributions = contributions
      .filter(c => new Date(c.date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Estimate monthly income as 10x average monthly contribution
    const avgMonthlyContribution = recentContributions.length > 0 
      ? recentContributions.reduce((sum, c) => sum + c.amount, 0) / Math.min(3, recentContributions.length)
      : 0;
    
    const estimatedMonthlyIncome = avgMonthlyContribution * 10;
    
    // Calculate current debt obligations
    const activeLoans = db.getLoans(memberId).filter(l => l.status === 'disbursed' && l.remainingBalance > 0);
    const currentDebtPayments = activeLoans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);
    
    // Calculate proposed loan payment
    const user = db.getUserById(memberId);
    const creditScore = user?.creditScore || 300;
    const loanDetails = this.calculateLoanDetails(loanAmount, termMonths, creditScore);
    const proposedPayment = loanDetails.monthlyPayment;
    
    // Total debt payments
    const totalDebtPayments = currentDebtPayments + proposedPayment;
    const debtToIncomeRatio = estimatedMonthlyIncome > 0 ? (totalDebtPayments / estimatedMonthlyIncome) * 100 : 100;
    
    // Maximum affordable payment (30% of income)
    const maxAffordablePayment = estimatedMonthlyIncome * 0.30;
    
    const reasons: string[] = [];
    let affordable = true;

    if (debtToIncomeRatio > 30) {
      affordable = false;
      reasons.push(`Debt-to-income ratio too high: ${debtToIncomeRatio.toFixed(1)}% (max 30%)`);
    }

    if (proposedPayment > maxAffordablePayment) {
      affordable = false;
      reasons.push(`Monthly payment exceeds affordable limit: KSh ${proposedPayment.toLocaleString()} > KSh ${maxAffordablePayment.toLocaleString()}`);
    }

    if (estimatedMonthlyIncome < 10000) {
      affordable = false;
      reasons.push('Insufficient income history to assess affordability');
    }

    if (affordable) {
      reasons.push('Loan payment is within affordable limits');
    }

    return {
      affordable,
      monthlyIncome: estimatedMonthlyIncome,
      debtToIncomeRatio,
      maxAffordablePayment,
      reasons
    };
  }
}