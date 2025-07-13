import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/db';
import { users, contributions, loans } from '@/db/schema';
import { eq, count, sum, desc, and, gte } from 'drizzle-orm';

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total members
    const totalMembers = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'member'));

    // Get total savings
    const totalSavings = await db
      .select({ total: sum(contributions.amount) })
      .from(contributions)
      .where(eq(contributions.status, 'completed'));

    // Get total loans
    const totalLoans = await db
      .select({ total: sum(loans.amount) })
      .from(loans)
      .where(eq(loans.status, 'disbursed'));

    // Get pending loans
    const pendingLoans = await db
      .select({ count: count() })
      .from(loans)
      .where(eq(loans.status, 'pending'));

    // Get monthly growth (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newMembers = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.role, 'member'),
          gte(users.createdAt, thirtyDaysAgo)
        )
      );

    const recentContributions = await db
      .select({ total: sum(contributions.amount) })
      .from(contributions)
      .where(
        and(
          eq(contributions.status, 'completed'),
          gte(contributions.createdAt, thirtyDaysAgo)
        )
      );

    return NextResponse.json({
      totalMembers: totalMembers[0].count,
      totalSavings: parseFloat(totalSavings[0].total || '0'),
      totalLoans: parseFloat(totalLoans[0].total || '0'),
      pendingLoans: pendingLoans[0].count,
      monthlyGrowth: {
        members: newMembers[0].count,
        savings: parseFloat(recentContributions[0].total || '0'),
      },
    });
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}