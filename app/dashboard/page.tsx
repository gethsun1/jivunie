'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Banknote, 
  CreditCard, 
  TrendingUp, 
  Shield, 
  Plus,
  Calendar,
  Users,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { authService } from '@/lib/auth';
import { db } from '@/lib/database';
import { CreditScoringService } from '@/lib/credit-scoring';
import { LoanCalculatorService } from '@/lib/loan-calculator';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

export default function DashboardPage() {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [stats, setStats] = useState({
    totalContributions: 0,
    monthlyTarget: 5000,
    activeLoans: 0,
    creditScore: 300,
    insuranceCoverage: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [contributionChart, setContributionChart] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // Get user's contributions
    const contributions = db.getContributions(user.id).filter(c => c.status === 'completed');
    const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);

    // Get user's loans
    const loans = db.getLoans(user.id);
    const activeLoans = loans.filter(l => l.status === 'disbursed' && l.remainingBalance > 0);

    // Get insurance coverage
    const insurance = db.getInsuranceCoverage(user.id);

    // Update credit score
    const creditScore = CreditScoringService.updateCreditScore(user.id, 'Dashboard view');

    // Prepare chart data
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthContributions = contributions.filter(c => {
        const contribDate = new Date(c.date);
        return contribDate.getMonth() === date.getMonth() && 
               contribDate.getFullYear() === date.getFullYear();
      });
      
      const monthTotal = monthContributions.reduce((sum, c) => sum + c.amount, 0);
      last6Months.push({ month: monthKey, amount: monthTotal });
    }

    setStats({
      totalContributions,
      monthlyTarget: 5000,
      activeLoans: activeLoans.length,
      creditScore,
      insuranceCoverage: insurance?.coverage || 0
    });

    setContributionChart(last6Months);

    // Get recent activity
    const recentContributions = contributions.slice(-3).map(c => ({
      type: 'contribution',
      description: `Contribution of KSh ${c.amount.toLocaleString()}`,
      date: c.date,
      amount: c.amount
    }));

    const recentLoanPayments = activeLoans.slice(-2).map(l => ({
      type: 'loan',
      description: `Loan payment due: KSh ${l.monthlyPayment.toLocaleString()}`,
      date: l.nextPaymentDate,
      amount: l.monthlyPayment
    }));

    setRecentActivity([...recentContributions, ...recentLoanPayments]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5));

  }, [user]);

  if (!user) return null;

  const creditCategory = CreditScoringService.getCreditScoreCategory(stats.creditScore);
  const eligibility = LoanCalculatorService.calculateEligibility(user.id);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user.fullName.split(' ')[0]}!
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Here's your financial overview for today
            </p>
          </div>
          <Link href="/dashboard/contributions">
            <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Make Contribution
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Total Savings</p>
                  <p className="text-2xl font-bold">KSh {stats.totalContributions.toLocaleString()}</p>
                </div>
                <Banknote className="h-8 w-8 text-green-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Active Loans</p>
                  <p className="text-2xl font-bold">{stats.activeLoans}</p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-300">Credit Score</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{stats.creditScore}</p>
                    <Badge 
                      variant="secondary" 
                      className={`bg-${creditCategory.color}-100 text-${creditCategory.color}-800`}
                    >
                      {creditCategory.category}
                    </Badge>
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-300">Insurance Coverage</p>
                  <p className="text-2xl font-bold">
                    {stats.insuranceCoverage > 0 
                      ? `KSh ${(stats.insuranceCoverage / 1000)}K` 
                      : 'None'
                    }
                  </p>
                </div>
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contribution Trend */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Contribution Trend</CardTitle>
              <CardDescription>Your savings over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={contributionChart}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`KSh ${value.toLocaleString()}`, 'Amount']} />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Progress */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Monthly Progress</CardTitle>
              <CardDescription>Progress towards your monthly target</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Target: KSh {stats.monthlyTarget.toLocaleString()}</span>
                <span>This Month: KSh {contributionChart[contributionChart.length - 1]?.amount?.toLocaleString() || '0'}</span>
              </div>
              <Progress 
                value={(contributionChart[contributionChart.length - 1]?.amount || 0) / stats.monthlyTarget * 100} 
                className="h-3"
              />
              
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center">
                    <Target className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium">Savings Goal</span>
                  </div>
                  <span className="text-sm text-green-600">On Track</span>
                </div>
                
                {eligibility.eligible && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium">Loan Eligible</span>
                    </div>
                    <span className="text-sm text-blue-600">KSh {eligibility.maxAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest transactions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center">
                      {activity.type === 'contribution' ? (
                        <Banknote className="h-5 w-5 text-green-600 mr-3" />
                      ) : (
                        <CreditCard className="h-5 w-5 text-blue-600 mr-3" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-gray-500 py-8">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <Link href="/dashboard/contributions">
                  <Button variant="outline" className="w-full justify-start">
                    <Banknote className="mr-2 h-4 w-4" />
                    Make a Contribution
                  </Button>
                </Link>
                
                <Link href="/dashboard/loans">
                  <Button variant="outline" className="w-full justify-start">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Apply for Loan
                  </Button>
                </Link>
                
                <Link href="/dashboard/credit-score">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Check Credit Score
                  </Button>
                </Link>
                
                <Link href="/dashboard/insurance">
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="mr-2 h-4 w-4" />
                    Insurance Coverage
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}