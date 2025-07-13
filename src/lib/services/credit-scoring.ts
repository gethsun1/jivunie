import { db } from '@/db';
import { users, contributions, loans, loanPayments, creditScoreHistory } from '@/db/schema';
import { eq, desc, and, gte, count } from 'drizzle-orm';

export class CreditScoringService {
  private static readonly BASE_SCORE = 300;
  private static readonly MAX_SCORE = 850;
  private static readonly MIN_SCORE = 300;

  static async calculateCreditScore(userId: number): Promise<number> {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) return this.BASE_SCORE;

    let score = this.BASE_SCORE;
    
    // Get user's financial history
    const userContributions = await db
      .select()
      .from(contributions)
      .where(and(eq(contributions.userId, userId), eq(contributions.status, 'completed')));

    const userLoans = await db
      .select()
      .from(loans)
      .where(eq(loans.userId, userId));

    const allPayments = await db
      .select()
      .from(loanPayments)
      .where(eq(loanPayments.loanId, userLoans[0]?.id || 0));

    // Factor 1: Contribution consistency (+3 points per consistent month)
    score += await this.calculateContributionScore(userContributions);

    // Factor 2: Loan repayment history
    score += await this.calculateRepaymentScore(userLoans, allPayments);

    // Factor 3: Length of membership (tenure bonus)
    score += this.calculateTenureScore(user[0].createdAt);

    // Factor 4: Overall debt-to-savings ratio
    score += this.calculateDebtRatioScore(userContributions, userLoans);

    // Ensure score stays within bounds
    return Math.max(this.MIN_SCORE, Math.min(this.MAX_SCORE, Math.round(score)));
  }

  private static calculateContributionScore(contributions: any[]): number {
    if (contributions.length === 0) return 0;

    const monthlyContributions = this.groupContributionsByMonth(contributions);
    
    let score = 0;
    let consecutiveMonths = 0;
    const currentDate = new Date();
    
    // Check last 12 months for consistency
    for (let i = 0; i < 12; i++) {
      const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}`;
      
      if (monthlyContributions[monthKey]) {
        consecutiveMonths++;
        score += 3; // +3 points per month with contributions
        
        // Bonus for early contributions (before 15th of month)
        const earlyContributions = monthlyContributions[monthKey].filter((c: any) => {
          const day = new Date(c.createdAt).getDate();
          return day <= 15;
        });
        
        if (earlyContributions.length > 0) {
          score += 2; // Early payment bonus
        }
      } else {
        break; // Break consecutive streak
      }
    }

    // Bonus for consecutive contribution months
    if (consecutiveMonths >= 6) score += 20;
    if (consecutiveMonths >= 12) score += 30;

    return score;
  }

  private static calculateRepaymentScore(loans: any[], payments: any[]): number {
    if (loans.length === 0) return 0;

    let score = 0;
    let totalPayments = 0;
    let onTimePayments = 0;
    let earlyPayments = 0;

    loans.forEach(loan => {
      const loanPayments = payments.filter(p => p.loanId === loan.id && p.status === 'completed');
      
      loanPayments.forEach(payment => {
        totalPayments++;
        
        // Calculate if payment was on time
        const paymentDate = new Date(payment.completedAt);
        const expectedDate = new Date(loan.nextPaymentDate || loan.disbursementDate || loan.applicationDate);
        const daysDifference = Math.floor((paymentDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDifference <= 0) {
          onTimePayments++;
          if (daysDifference <= -5) {
            earlyPayments++;
          }
        }
      });

      // Bonus for completed loans
      if (loan.status === 'completed') {
        score += 50;
      }
    });

    if (totalPayments > 0) {
      const onTimeRate = onTimePayments / totalPayments;
      score += Math.round(onTimeRate * 100); // Up to 100 points for perfect payment history
      
      // Early payment bonus
      score += earlyPayments * 10;
    }

    // Penalty for defaults or rejected loans
    const defaultedLoans = loans.filter(l => l.status === 'rejected');
    score -= defaultedLoans.length * 50;

    return score;
  }

  private static calculateTenureScore(joinDate: Date): number {
    const join = new Date(joinDate);
    const now = new Date();
    const monthsDifference = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
    
    // +2 points per month of membership, max 60 points (30 months)
    return Math.min(60, monthsDifference * 2);
  }

  private static calculateDebtRatioScore(contributions: any[], loans: any[]): number {
    const totalSavings = contributions.reduce((sum, c) => sum + parseFloat(c.amount), 0);
    const totalOutstandingDebt = loans
      .filter(l => l.status === 'disbursed')
      .reduce((sum, l) => sum + parseFloat(l.remainingBalance), 0);

    if (totalSavings === 0) return 0;
    
    const debtRatio = totalOutstandingDebt / totalSavings;
    
    // Better debt ratio = higher score
    if (debtRatio <= 0.3) return 30; // Very good
    if (debtRatio <= 0.5) return 20; // Good
    if (debtRatio <= 0.7) return 10; // Fair
    if (debtRatio <= 1.0) return 0;  // Acceptable
    return -20; // Poor
  }

  private static groupContributionsByMonth(contributions: any[]): Record<string, any[]> {
    return contributions.reduce((groups, contribution) => {
      const date = new Date(contribution.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(contribution);
      
      return groups;
    }, {} as Record<string, any[]>);
  }

  static async updateCreditScore(userId: number, reason: string): Promise<number> {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) return this.BASE_SCORE;

    const oldScore = user[0].creditScore;
    const newScore = await this.calculateCreditScore(userId);
    const change = newScore - oldScore;

    // Update user's credit score
    await db
      .update(users)
      .set({ creditScore: newScore, updatedAt: new Date() })
      .where(eq(users.id, userId));

    // Record the change in history
    if (change !== 0) {
      await db.insert(creditScoreHistory).values({
        userId,
        score: newScore,
        change,
        reason,
      });
    }

    return newScore;
  }

  static getCreditScoreCategory(score: number): { category: string; color: string; description: string } {
    if (score >= 750) {
      return {
        category: 'Excellent',
        color: 'green',
        description: 'Outstanding credit management'
      };
    } else if (score >= 700) {
      return {
        category: 'Very Good',
        color: 'blue',
        description: 'Above average credit history'
      };
    } else if (score >= 650) {
      return {
        category: 'Good',
        color: 'yellow',
        description: 'Good credit standing'
      };
    } else if (score >= 600) {
      return {
        category: 'Fair',
        color: 'orange',
        description: 'Average credit profile'
      };
    } else {
      return {
        category: 'Poor',
        color: 'red',
        description: 'Needs improvement'
      };
    }
  }
}