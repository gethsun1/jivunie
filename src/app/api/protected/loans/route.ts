import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/db';
import { loans, contributions } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';
import { LoanCalculatorService } from '@/lib/services/loan-calculator';

const loanApplicationSchema = z.object({
  amount: z.number().min(1000, 'Minimum loan amount is KSh 1,000'),
  term: z.number().min(6).max(36, 'Loan term must be between 6 and 36 months'),
  purpose: z.string().min(5, 'Please provide a purpose for the loan'),
});

/**
 * @swagger
 * /api/protected/loans:
 *   get:
 *     summary: Get user loans
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user loans
 *   post:
 *     summary: Apply for a new loan
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 1000
 *               term:
 *                 type: number
 *                 minimum: 6
 *                 maximum: 36
 *               purpose:
 *                 type: string
 *     responses:
 *       201:
 *         description: Loan application submitted successfully
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userLoans = await db
      .select()
      .from(loans)
      .where(eq(loans.userId, parseInt(session.user.id)))
      .orderBy(desc(loans.applicationDate));

    return NextResponse.json({ loans: userLoans });
  } catch (error) {
    console.error('Error fetching loans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = loanApplicationSchema.parse(body);

    // Check loan eligibility
    const eligibility = await LoanCalculatorService.calculateEligibility(
      parseInt(session.user.id)
    );

    if (!eligibility.eligible) {
      return NextResponse.json(
        { 
          error: 'Loan application rejected',
          reasons: eligibility.reasons 
        },
        { status: 400 }
      );
    }

    if (validatedData.amount > eligibility.maxAmount) {
      return NextResponse.json(
        { 
          error: `Requested amount exceeds maximum eligible amount of KSh ${eligibility.maxAmount.toLocaleString()}` 
        },
        { status: 400 }
      );
    }

    // Calculate loan details
    const loanDetails = LoanCalculatorService.calculateLoanDetails(
      validatedData.amount,
      validatedData.term,
      session.user.creditScore
    );

    // Create loan application
    const newLoan = await db
      .insert(loans)
      .values({
        userId: parseInt(session.user.id),
        amount: validatedData.amount.toString(),
        interestRate: loanDetails.interestRate.toString(),
        term: validatedData.term,
        purpose: validatedData.purpose,
        status: 'pending',
        monthlyPayment: loanDetails.monthlyPayment.toString(),
        totalPayable: loanDetails.totalPayable.toString(),
        amountPaid: '0',
        remainingBalance: validatedData.amount.toString(),
      })
      .returning();

    return NextResponse.json(
      {
        message: 'Loan application submitted successfully',
        loan: newLoan[0],
        loanDetails,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating loan application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}