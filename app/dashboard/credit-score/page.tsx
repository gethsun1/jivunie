'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  AlertCircle,
  CheckCircle,
  Calendar,
  Target,
  BarChart3,
  Info
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { authService } from '@/lib/auth';
import { db } from '@/lib/database';
import { CreditScoringService } from '@/lib/credit-scoring';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

export default function CreditScorePage() {
  const [creditScore, setCreditScore] = useState(300);
  const [scoreHistory, setScoreHistory] = useState<any[]>([]);
  const [scoreBreakdown, setScoreBreakdown] = useState<any[]>([]);
  const [improvements, setImprovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const user = authService.getCurrentUser();

  useEffect(() => {
    if (!user) return;
    
    loadCreditScoreData();
  }, [user]);

  const loadCreditScoreData = () => {
    if (!user) return;

    // Update and get current credit score
    const currentScore = CreditScoringService.updateCreditScore(user.id, 'Credit score dashboard view');
    setCreditScore(currentScore);

    // Get score history
    const history = db.getCreditScoreHistory(user.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-12) // Last 12 entries
      .map(entry => ({
        date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: entry.score,
        change: entry.change
      }));
    
    setScoreHistory(history);

    // Calculate score breakdown
    const contributions = db.getContributions(user.id).filter(c => c.status === 'completed');
    const loans = db.getLoans(user.id);
    const payments = loans.flatMap(loan => db.getLoanPayments(loan.id));

    const breakdown = [
      {
        category: 'Payment History',
        impact: 35,
        score: calculatePaymentHistoryScore(loans, payments),
        color: '#10B981'
      },
      {
        category: 'Contribution Consistency',
        impact: 30,
        score: calculateContributionScore(contributions),
        color: '#3B82F6'
      },
      {
        category: 'Account Age',
        impact: 15,
        score: calculateAccountAgeScore(user.joinDate),
        color: '#8B5CF6'
      },
      {
        category: 'Credit Utilization',
        impact: 20,
        score: calculateCreditUtilizationScore(contributions, loans),
        color: '#F59E0B'
      }
    ];

    setScoreBreakdown(breakdown);

    // Generate improvement suggestions
    const suggestions = generateImprovementSuggestions(currentScore, contributions, loans);
    setImprovements(suggestions);

    setLoading(false);
  };

  const calculatePaymentHistoryScore = (loans: any[], payments: any[]) => {
    if (loans.length === 0) return 70; // Base score for no loan history
    
    const completedPayments = payments.filter(p => p.status === 'completed').length;
    const totalExpectedPayments = loans.reduce((sum, loan) => {
      if (loan.status === 'disbursed') {
        const monthsActive = Math.floor((Date.now() - new Date(loan.disbursementDate || loan.applicationDate).getTime()) / (30 * 24 * 60 * 60 * 1000));
        return sum + Math.min(monthsActive, loan.term);
      }
      return sum;
    }, 0);
    
    if (totalExpectedPayments === 0) return 70;
    return Math.min(100, (completedPayments / totalExpectedPayments) * 100);
  };

  const calculateContributionScore = (contributions: any[]) => {
    if (contributions.length === 0) return 0;
    
    const monthlyContributions = contributions.reduce((months, contribution) => {
      const date = new Date(contribution.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      months.add(key);
      return months;
    }, new Set()).size;
    
    return Math.min(100, (monthlyContributions / 12) * 100); // Score based on consistency over 12 months
  };

  const calculateAccountAgeScore = (joinDate: string) => {
    const monthsOld = (Date.now() - new Date(joinDate).getTime()) / (30 * 24 * 60 * 60 * 1000);
    return Math.min(100, (monthsOld / 24) * 100); // Max score at 24 months
  };

  const calculateCreditUtilizationScore = (contributions: any[], loans: any[]) => {
    const totalSavings = contributions.reduce((sum, c) => sum + c.amount, 0);
    const totalDebt = loans.filter(l => l.status === 'disbursed').reduce((sum, l) => sum + l.remainingBalance, 0);
    
    if (totalSavings === 0) return 0;
    const utilization = totalDebt / totalSavings;
    
    if (utilization <= 0.3) return 100;
    if (utilization <= 0.5) return 80;
    if (utilization <= 0.7) return 60;
    return 40;
  };

  const generateImprovementSuggestions = (score: number, contributions: any[], loans: any[]) => {
    const suggestions = [];
    
    if (contributions.length < 6) {
      suggestions.push({
        title: 'Make Regular Contributions',
        description: 'Contribute monthly for at least 6 months to improve your credit profile',
        impact: 'High',
        icon: Target,
        action: 'Start contributing regularly'
      });
    }
    
    const activeLoans = loans.filter(l => l.status === 'disbursed' && l.remainingBalance > 0);
    if (activeLoans.length > 0) {
      suggestions.push({
        title: 'Pay Loans Early',
        description: 'Making early loan payments can boost your credit score significantly',
        impact: 'Medium',
        icon: CheckCircle,
        action: 'Make an early payment'
      });
    }
    
    if (score < 650) {
      suggestions.push({
        title: 'Increase Contribution Amount',
        description: 'Higher monthly contributions demonstrate financial stability',
        impact: 'Medium',
        icon: TrendingUp,
        action: 'Increase monthly contribution'
      });
    }
    
    const recentContributions = contributions.filter(c => 
      new Date(c.date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    );
    
    if (recentContributions.length === 0) {
      suggestions.push({
        title: 'Resume Contributions',
        description: 'No contributions in the last 3 months may negatively impact your score',
        impact: 'High',
        icon: AlertCircle,
        action: 'Make a contribution now'
      });
    }

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  };

  const getCreditScoreCategory = (score: number) => {
    if (score >= 750) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 700) return { label: 'Very Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (score >= 650) return { label: 'Good', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (score >= 600) return { label: 'Fair', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { label: 'Poor', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const getScoreColor = (score: number) => {
    if (score >= 750) return '#10B981';
    if (score >= 700) return '#3B82F6';
    if (score >= 650) return '#F59E0B';
    if (score >= 600) return '#F97316';
    return '#EF4444';
  };

  if (!user) return null;

  const category = getCreditScoreCategory(creditScore);
  const scorePercentage = ((creditScore - 300) / (850 - 300)) * 100;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Credit Score</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Monitor and improve your creditworthiness
            </p>
          </div>
          <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
            <BarChart3 className="mr-2 h-4 w-4" />
            View Full Report
          </Button>
        </div>

        {/* Credit Score Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Score */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Your Credit Score</CardTitle>
              <CardDescription>Based on your financial activity with Jivunie SACCO</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="relative w-40 h-40 mx-auto mb-6">
                <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 144 144">
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke={getScoreColor(creditScore)}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(scorePercentage / 100) * 377} 377`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold" style={{ color: getScoreColor(creditScore) }}>
                    {creditScore}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">out of 850</div>
                </div>
              </div>
              
              <Badge className={`${category.bgColor} ${category.color} text-lg px-4 py-2`}>
                {category.label}
              </Badge>
              
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-600 dark:text-gray-300">Range</div>
                  <div className="font-bold">300 - 850</div>
                </div>
                <div>
                  <div className="font-medium text-gray-600 dark:text-gray-300">Last Updated</div>
                  <div className="font-bold">{new Date().toLocaleDateString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score Trend */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Score History</CardTitle>
              <CardDescription>Your credit score trend over time</CardDescription>
            </CardHeader>
            <CardContent>
              {scoreHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={scoreHistory}>
                    <XAxis dataKey="date" />
                    <YAxis domain={[300, 850]} />
                    <Tooltip 
                      formatter={(value, name) => [value, 'Credit Score']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke={getScoreColor(creditScore)} 
                      strokeWidth={3}
                      dot={{ fill: getScoreColor(creditScore), strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No score history available yet</p>
                    <p className="text-sm">Make contributions to start building your credit history</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Score Breakdown */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Score Breakdown</CardTitle>
            <CardDescription>Factors that influence your credit score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {scoreBreakdown.map((factor, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: factor.color }}
                      />
                      <span className="font-medium">{factor.category}</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {factor.impact}% impact
                      </Badge>
                    </div>
                    <span className="font-bold">{Math.round(factor.score)}/100</span>
                  </div>
                  <Progress value={factor.score} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Improvement Suggestions */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Ways to Improve Your Score</CardTitle>
            <CardDescription>Actionable steps to boost your creditworthiness</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {improvements.map((suggestion, index) => (
                <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <suggestion.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        {suggestion.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {suggestion.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="secondary"
                          className={
                            suggestion.impact === 'High' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {suggestion.impact} Impact
                        </Badge>
                        <Button variant="outline" size="sm">
                          {suggestion.action}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Score Range Guide */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Credit Score Ranges</CardTitle>
            <CardDescription>Understanding what your score means</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { range: '750-850', label: 'Excellent', description: 'Best loan rates, highest loan amounts, premium insurance', color: 'bg-green-100 text-green-800' },
                { range: '700-749', label: 'Very Good', description: 'Good loan rates, high loan amounts, standard insurance', color: 'bg-blue-100 text-blue-800' },
                { range: '650-699', label: 'Good', description: 'Fair loan rates, moderate loan amounts, basic insurance', color: 'bg-yellow-100 text-yellow-800' },
                { range: '600-649', label: 'Fair', description: 'Higher loan rates, limited loan amounts', color: 'bg-orange-100 text-orange-800' },
                { range: '300-599', label: 'Poor', description: 'Highest loan rates, very limited loan access', color: 'bg-red-100 text-red-800' }
              ].map((range, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Badge className={range.color}>{range.label}</Badge>
                    <div>
                      <div className="font-medium">{range.range}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{range.description}</div>
                    </div>
                  </div>
                  {creditScore >= parseInt(range.range.split('-')[0]) && creditScore <= parseInt(range.range.split('-')[1]) && (
                    <Badge variant="outline">Your Range</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}