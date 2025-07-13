import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/db';
import { contributions, users } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';
import { CreditScoringService } from '@/lib/services/credit-scoring';

const contributionSchema = z.object({
  amount: z.number().min(100, 'Minimum contribution is KSh 100'),
  method: z.enum(['mpesa', 'bank', 'cash']),
  description: z.string().optional(),
});

/**
 * @swagger
 * /api/protected/contributions:
 *   get:
 *     summary: Get user contributions
 *     tags: [Contributions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user contributions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contributions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Contribution'
 *   post:
 *     summary: Create a new contribution
 *     tags: [Contributions]
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
 *                 minimum: 100
 *               method:
 *                 type: string
 *                 enum: [mpesa, bank, cash]
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Contribution created successfully
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userContributions = await db
      .select()
      .from(contributions)
      .where(eq(contributions.userId, parseInt(session.user.id)))
      .orderBy(desc(contributions.createdAt));

    return NextResponse.json({ contributions: userContributions });
  } catch (error) {
    console.error('Error fetching contributions:', error);
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
    const validatedData = contributionSchema.parse(body);

    // Generate transaction reference
    const transactionRef = `TXN${Date.now()}${Math.random().toString(36).substr(2, 5)}`;

    // Simulate M-Pesa payment processing
    const paymentResult = await simulateMpesaPayment({
      amount: validatedData.amount,
      phoneNumber: session.user.phone || '',
      reference: transactionRef,
    });

    // Create contribution record
    const newContribution = await db
      .insert(contributions)
      .values({
        userId: parseInt(session.user.id),
        amount: validatedData.amount.toString(),
        method: validatedData.method,
        transactionRef,
        status: paymentResult.success ? 'completed' : 'failed',
        description: validatedData.description || `Monthly contribution via ${validatedData.method.toUpperCase()}`,
        completedAt: paymentResult.success ? new Date() : null,
      })
      .returning();

    // Update credit score if payment successful
    if (paymentResult.success) {
      await CreditScoringService.updateCreditScore(
        parseInt(session.user.id),
        'New contribution received'
      );
    }

    return NextResponse.json(
      {
        message: paymentResult.success ? 'Contribution successful' : 'Payment failed',
        contribution: newContribution[0],
        paymentDetails: paymentResult,
      },
      { status: paymentResult.success ? 201 : 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating contribution:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Mock M-Pesa API simulation
async function simulateMpesaPayment({
  amount,
  phoneNumber,
  reference,
}: {
  amount: number;
  phoneNumber: string;
  reference: string;
}) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Simulate 95% success rate
  const success = Math.random() > 0.05;

  return {
    success,
    transactionId: success ? `MP${Date.now()}` : null,
    message: success ? 'Payment processed successfully' : 'Payment failed - insufficient funds',
    amount,
    phoneNumber,
    reference,
    timestamp: new Date().toISOString(),
  };
}