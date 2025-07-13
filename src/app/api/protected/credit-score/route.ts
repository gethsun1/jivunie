import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/db';
import { creditScoreHistory } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { CreditScoringService } from '@/lib/services/credit-scoring';

/**
 * @swagger
 * /api/protected/credit-score:
 *   get:
 *     summary: Get user credit score and history
 *     tags: [Credit Score]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Credit score information
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current credit score
    const currentScore = await CreditScoringService.updateCreditScore(
      parseInt(session.user.id),
      'Credit score check'
    );

    // Get score history
    const scoreHistory = await db
      .select()
      .from(creditScoreHistory)
      .where(eq(creditScoreHistory.userId, parseInt(session.user.id)))
      .orderBy(desc(creditScoreHistory.createdAt))
      .limit(12);

    // Get score category
    const category = CreditScoringService.getCreditScoreCategory(currentScore);

    return NextResponse.json({
      currentScore,
      category,
      history: scoreHistory,
    });
  } catch (error) {
    console.error('Error fetching credit score:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}