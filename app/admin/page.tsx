'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Banknote,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { authService } from '@/lib/auth';
import { db } from '@/lib/database';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart as PieChartComponent, Pie, Cell, BarChart, Bar } from 'recharts';

// Type definitions for chart data
interface MemberGrowthData {
  month: string;
  members: number;
}

interface SavingsGrowthData {
  month: string;
  amount: number;
}

interface LoanDistributionData {
  purpose: string;
  count: number;
  percentage: number;
}

interface ChartData {
  memberGrowth: MemberGrowthData[];
  savingsGrowth: SavingsGrowthData[];
  loanDistribution: LoanDistributionData[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalSavings: 0,
    totalLoans: 0,
    pendingLoans: 0,
    activeLoans: 0,
    defaultRate: 0,
    monthlyGrowth: {
      members: 0,
      savings: 0,
      loans: 0
    }
  });
  
  const [recentMembers, setRecentMembers] = useState<any[]>([]);
  const [pendingLoans, setPendingLoans] = useState<any[]>([]);
  const [chartData, setChartData] = useState<ChartData>({
    memberGrowth: [],
    savingsGrowth: [],
    loanDistribution: []
  });

  const user = authService.getCurrentUser();

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    loadDashboardData();
  }, [user]);

  const loadDashboardData = () => {
    // Get all system data
    const allUsers = db.getUsers();
    const allContributions = db.getContributions() || [];
    const allLoans = db.getLoans() || [];

    // Calculate basic stats
    const members = allUsers.filter(u => u.role === 'member');
    const completedContributions = allContributions.filter((c: any) => c.status === 'completed');
    const totalSavings = completedContributions.reduce((sum: number, c: any) => sum + c.amount, 0);
    
    const activeLoansList = allLoans.filter((l: any) => l.status === 'disbursed');
    const pendingLoansList = allLoans.filter((l: any) => l.status === 'pending');
    const totalLoansAmount = activeLoansList.reduce((sum: number, l: any) => sum + l.amount, 0);
    
    // Calculate default rate
    const defaultedLoans = allLoans.filter((l: any) => l.status === 'rejected').length;
    const defaultRate = allLoans.length > 0 ? (defaultedLoans / allLoans.length) * 100 : 0;

    // Calculate monthly growth
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const thisMonthMembers = members.filter(m => {
      const joinDate = new Date(m.joinDate);
      return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear;
    }).length;

    const lastMonthMembers = members.filter(m => {
      const joinDate = new Date(m.joinDate);
      return joinDate.getMonth() === lastMonth && joinDate.getFullYear() === lastMonthYear;
    }).length;

    const memberGrowth = lastMonthMembers > 0 ? ((thisMonthMembers - lastMonthMembers) / lastMonthMembers) * 100 : 0;

    setStats({
      totalMembers: members.length,
      totalSavings,
      totalLoans: totalLoansAmount,
      pendingLoans: pendingLoansList.length,
      activeLoans: activeLoansList.length,
      defaultRate,
      monthlyGrowth: {
        members: memberGrowth,
        savings: 8.3, // Mock data
        loans: 15.2  // Mock data
      }
    });

    // Recent members
    const recent = members
      .sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime())
      .slice(0, 5);
    setRecentMembers(recent);

    // Pending loans with member info
    const pendingWithMembers = pendingLoansList.map((loan: any) => {
      const member = allUsers.find(u => u.id === loan.memberId);
      return { ...loan, member };
    }).slice(0, 5);
    setPendingLoans(pendingWithMembers);

    // Generate chart data
    generateChartData(members, completedContributions, allLoans);
  };

  const generateChartData = (members: any[], contributions: any[], loans: any[]) => {
    // Member growth over last 6 months
    const memberGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      
      const memberCount = members.filter(m => {
        const joinDate = new Date(m.joinDate);
        return joinDate <= date;
      }).length;
      
      memberGrowth.push({ month: monthKey, members: memberCount });
    }

    // Savings growth over last 6 months
    const savingsGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthContributions = contributions.filter((c: any) => {
        const contribDate = new Date(c.date);
        return contribDate.getMonth() === date.getMonth() && 
               contribDate.getFullYear() === date.getFullYear();
      });
      
      const monthTotal = monthContributions.reduce((sum: number, c: any) => sum + c.amount, 0);
      savingsGrowth.push({ month: monthKey, amount: monthTotal });
    }

    // Loan distribution by purpose
    const loanPurposes = loans.reduce((acc: any, loan: any) => {
      const purpose = loan.purpose || 'Other';
      acc[purpose] = (acc[purpose] || 0) + 1;
      return acc;
    }, {});

    const loanDistribution = Object.entries(loanPurposes).map(([purpose, count]) => ({
      purpose,
      count,
      percentage: ((count as number) / loans.length) * 100
    }));

    setChartData({
      memberGrowth,
      savingsGrowth,
      loanDistribution
    });
  };

  const approveLoan = async (loanId: string) => {
    const loan = db.getLoans().find((l: any) => l.id === loanId);
    if (!loan) return;

    db.updateLoan(loanId, {
      status: 'approved',
      approvalDate: new Date().toISOString()
    });

    // Create notification for member
    db.createNotification({
      userId: loan.memberId,
      title: 'Loan Approved',
      message: `Your loan application for KSh ${loan.amount.toLocaleString()} has been approved.`,
      type: 'success',
      read: false,
      date: new Date().toISOString()
    });

    loadDashboardData();
  };

  const rejectLoan = async (loanId: string) => {
    const loan = db.getLoans().find((l: any) => l.id === loanId);
    if (!loan) return;

    db.updateLoan(loanId, {
      status: 'rejected',
      approvalDate: new Date().toISOString()
    });

    // Create notification for member
    db.createNotification({
      userId: loan.memberId,
      title: 'Loan Application Rejected',
      message: `Your loan application for KSh ${loan.amount.toLocaleString()} has been rejected. Please contact support for details.`,
      type: 'error',
      read: false,
      date: new Date().toISOString()
    });

    loadDashboardData();
  };

  if (!user || user.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h2>
            <p className="text-gray-600 dark:text-gray-300">You don't have permission to access the admin dashboard.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300">
              System overview and management tools
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
            <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
              <Activity className="mr-2 h-4 w-4" />
              System Health
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Members</p>
                  <p className="text-3xl font-bold">{stats.totalMembers.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="text-sm">+{stats.monthlyGrowth.members.toFixed(1)}% this month</span>
                  </div>
                </div>
                <Users className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Total Savings</p>
                  <p className="text-3xl font-bold">KSh {(stats.totalSavings / 1000000).toFixed(1)}M</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="text-sm">+{stats.monthlyGrowth.savings}% this month</span>
                  </div>
                </div>
                <Banknote className="h-12 w-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Active Loans</p>
                  <p className="text-3xl font-bold">KSh {(stats.totalLoans / 1000000).toFixed(1)}M</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="text-sm">+{stats.monthlyGrowth.loans}% this month</span>
                  </div>
                </div>
                <CreditCard className="h-12 w-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Default Rate</p>
                  <p className="text-3xl font-bold">{stats.defaultRate.toFixed(1)}%</p>
                  <div className="flex items-center mt-2">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span className="text-sm">{stats.pendingLoans} pending reviews</span>
                  </div>
                </div>
                <DollarSign className="h-12 w-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="loans">Loan Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Member Growth Chart */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Member Growth</CardTitle>
                  <CardDescription>Total members over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData.memberGrowth}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="members" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Savings Growth Chart */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Monthly Contributions</CardTitle>
                  <CardDescription>Contribution amounts over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.savingsGrowth}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`KSh ${value.toLocaleString()}`, 'Amount']} />
                      <Bar dataKey="amount" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Recent Members</CardTitle>
                  <CardDescription>Latest member registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white font-medium text-sm">
                              {member.fullName.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{member.fullName}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{member.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={member.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {member.isVerified ? 'Verified' : 'Pending'}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(member.joinDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Loan Distribution</CardTitle>
                  <CardDescription>Loans by purpose</CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.loanDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChartComponent>
                        <Pie
                          data={chartData.loanDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          label={({ purpose, percentage }) => `${purpose}: ${percentage.toFixed(1)}%`}
                        >
                          {chartData.loanDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChartComponent>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <div className="text-center">
                        <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No loan data available</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="loans" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Pending Loan Applications</CardTitle>
                <CardDescription>Loans awaiting approval or rejection</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingLoans.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Applied Date</TableHead>
                        <TableHead>Credit Score</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingLoans.map((loan) => (
                        <TableRow key={loan.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{loan.member?.fullName || 'Unknown'}</div>
                              <div className="text-sm text-gray-600">{loan.member?.email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            KSh {loan.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="capitalize">{loan.purpose}</TableCell>
                          <TableCell>
                            {new Date(loan.applicationDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              loan.member?.creditScore >= 700 
                                ? 'bg-green-100 text-green-800'
                                : loan.member?.creditScore >= 600
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }>
                              {loan.member?.creditScore || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => approveLoan(loan.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectLoan(loan.id)}
                              >
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No pending loan applications
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      All loan applications have been processed
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}