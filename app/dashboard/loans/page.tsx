'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  CreditCard, 
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Calculator,
  FileText,
  DollarSign
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { authService } from '@/lib/auth';
import { db } from '@/lib/database';
import { LoanCalculatorService } from '@/lib/loan-calculator';
import { CreditScoringService } from '@/lib/credit-scoring';

export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eligibility, setEligibility] = useState<any>(null);
  const [loanDetails, setLoanDetails] = useState<any>(null);
  const [formData, setFormData] = useState({
    amount: '',
    term: '12',
    purpose: ''
  });
  const [stats, setStats] = useState({
    totalLoaned: 0,
    activeLoans: 0,
    totalRepaid: 0,
    nextPayment: 0
  });

  const user = authService.getCurrentUser();

  useEffect(() => {
    if (!user) return;
    loadLoans();
    checkEligibility();
  }, [user]);

  useEffect(() => {
    if (formData.amount && formData.term && user) {
      const amount = parseFloat(formData.amount);
      const term = parseInt(formData.term);
      if (amount > 0 && term > 0) {
        const details = LoanCalculatorService.calculateLoanDetails(amount, term, user.creditScore);
        setLoanDetails(details);
      }
    }
  }, [formData.amount, formData.term, user]);

  const loadLoans = () => {
    if (!user) return;
    
    const userLoans = db.getLoans(user.id)
      .sort((a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime());
    
    setLoans(userLoans);
    calculateStats(userLoans);
  };

  const checkEligibility = () => {
    if (!user) return;
    
    const eligibilityResult = LoanCalculatorService.calculateEligibility(user.id);
    setEligibility(eligibilityResult);
  };

  const calculateStats = (loans: any[]) => {
    const disbursed = loans.filter(l => l.status === 'disbursed' || l.status === 'completed');
    const active = loans.filter(l => l.status === 'disbursed' && l.remainingBalance > 0);
    
    const totalLoaned = disbursed.reduce((sum, l) => sum + l.amount, 0);
    const totalRepaid = disbursed.reduce((sum, l) => sum + l.amountPaid, 0);
    const nextPayment = active.length > 0 ? Math.min(...active.map(l => l.monthlyPayment)) : 0;
    
    setStats({
      totalLoaned,
      activeLoans: active.length,
      totalRepaid,
      nextPayment
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !eligibility?.eligible) return;
    
    setLoading(true);
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const amount = parseFloat(formData.amount);
      const term = parseInt(formData.term);
      const interestRate = LoanCalculatorService.calculateInterestRate(user.creditScore);
      const loanDetails = LoanCalculatorService.calculateLoanDetails(amount, term, user.creditScore);
      
      const loan = db.createLoan({
        memberId: user.id,
        amount,
        interestRate,
        term,
        purpose: formData.purpose,
        status: 'pending',
        applicationDate: new Date().toISOString(),
        monthlyPayment: loanDetails.monthlyPayment,
        totalPayable: loanDetails.totalPayable,
        amountPaid: 0,
        remainingBalance: amount,
      });
      
      // Create notification
      db.createNotification({
        userId: user.id,
        title: 'Loan Application Submitted',
        message: `Your loan application for KSh ${amount.toLocaleString()} has been submitted for review.`,
        type: 'info',
        read: false,
        date: new Date().toISOString()
      });
      
      setIsDialogOpen(false);
      setFormData({ amount: '', term: '12', purpose: '' });
      loadLoans();
      checkEligibility();
    } catch (error) {
      console.error('Loan application failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'disbursed':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'disbursed':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Loans</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Apply for loans and manage your borrowing
            </p>
          </div>
          {eligibility?.eligible && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Apply for Loan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Loan Application</DialogTitle>
                  <DialogDescription>
                    Complete your loan application details
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount">Loan Amount (KSh)</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="50000"
                        required
                        min="1000"
                        max={eligibility.maxAmount}
                        step="1000"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Maximum: KSh {eligibility.maxAmount.toLocaleString()}
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="term">Loan Term (Months)</Label>
                      <Select value={formData.term} onValueChange={(value) => setFormData(prev => ({ ...prev, term: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6 Months</SelectItem>
                          <SelectItem value="12">12 Months</SelectItem>
                          <SelectItem value="18">18 Months</SelectItem>
                          <SelectItem value="24">24 Months</SelectItem>
                          <SelectItem value="36">36 Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="purpose">Loan Purpose</Label>
                    <Select value={formData.purpose} onValueChange={(value) => setFormData(prev => ({ ...prev, purpose: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select loan purpose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="business">Business Investment</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="home">Home Improvement</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="agriculture">Agriculture</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {loanDetails && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Loan Summary</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-800 dark:text-blue-400">Monthly Payment:</span>
                          <span className="font-bold ml-2">KSh {loanDetails.monthlyPayment.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-blue-800 dark:text-blue-400">Interest Rate:</span>
                          <span className="font-bold ml-2">{loanDetails.interestRate}% p.a.</span>
                        </div>
                        <div>
                          <span className="text-blue-800 dark:text-blue-400">Total Payable:</span>
                          <span className="font-bold ml-2">KSh {loanDetails.totalPayable.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-blue-800 dark:text-blue-400">Total Interest:</span>
                          <span className="font-bold ml-2">KSh {loanDetails.totalInterest.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={loading || !formData.purpose}>
                    {loading ? 'Submitting Application...' : 'Submit Loan Application'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Eligibility Alert */}
        {eligibility && !eligibility.eligible && (
          <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div>
                <strong>Loan Eligibility Requirements:</strong>
                <ul className="mt-2 text-sm">
                  {eligibility.reasons.map((reason: string, index: number) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-yellow-600 rounded-full mr-2 flex-shrink-0"></span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Borrowed</p>
                  <p className="text-2xl font-bold text-blue-600">
                    KSh {stats.totalLoaned.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Active Loans</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.activeLoans}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Repaid</p>
                  <p className="text-2xl font-bold text-purple-600">
                    KSh {stats.totalRepaid.toLocaleString()}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Next Payment</p>
                  <p className="text-2xl font-bold text-orange-600">
                    KSh {stats.nextPayment.toLocaleString()}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="loans" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="loans">My Loans</TabsTrigger>
            <TabsTrigger value="calculator">Loan Calculator</TabsTrigger>
            <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
          </TabsList>

          <TabsContent value="loans">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Loan History</CardTitle>
                <CardDescription>All your loan applications and their status</CardDescription>
              </CardHeader>
              <CardContent>
                {loans.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date Applied</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Next Payment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loans.map((loan) => (
                        <TableRow key={loan.id}>
                          <TableCell>
                            {new Date(loan.applicationDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            KSh {loan.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="capitalize">{loan.purpose}</TableCell>
                          <TableCell>{loan.term} months</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(loan.status)}>
                              <div className="flex items-center">
                                {getStatusIcon(loan.status)}
                                <span className="ml-1 capitalize">{loan.status}</span>
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            KSh {loan.remainingBalance.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {loan.nextPaymentDate ? (
                              <>
                                <div>KSh {loan.monthlyPayment.toLocaleString()}</div>
                                <div className="text-xs text-gray-500">
                                  {new Date(loan.nextPaymentDate).toLocaleDateString()}
                                </div>
                              </>
                            ) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No loans yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {eligibility?.eligible 
                        ? "You're eligible for a loan. Apply now to get started."
                        : "Build your contribution history to become eligible for loans."
                      }
                    </p>
                    {eligibility?.eligible && (
                      <Button 
                        onClick={() => setIsDialogOpen(true)}
                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Apply for First Loan
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calculator">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Loan Calculator</CardTitle>
                <CardDescription>Calculate loan payments and interest</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="calc-amount">Loan Amount (KSh)</Label>
                      <Input
                        id="calc-amount"
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="100000"
                        min="1000"
                        step="1000"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="calc-term">Loan Term</Label>
                      <Select value={formData.term} onValueChange={(value) => setFormData(prev => ({ ...prev, term: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6 Months</SelectItem>
                          <SelectItem value="12">12 Months</SelectItem>
                          <SelectItem value="18">18 Months</SelectItem>
                          <SelectItem value="24">24 Months</SelectItem>
                          <SelectItem value="36">36 Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Your Credit Score</p>
                      <p className="text-xl font-bold">{user.creditScore}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Interest Rate: {LoanCalculatorService.calculateInterestRate(user.creditScore)}% p.a.
                      </p>
                    </div>
                  </div>
                  
                  {loanDetails && (
                    <div className="space-y-4">
                      <div className="p-6 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg">
                        <h4 className="font-bold text-lg mb-4">Loan Breakdown</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Principal Amount:</span>
                            <span className="font-bold">KSh {loanDetails.amount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Monthly Payment:</span>
                            <span className="font-bold text-blue-600">KSh {loanDetails.monthlyPayment.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Interest:</span>
                            <span className="font-bold">KSh {loanDetails.totalInterest.toLocaleString()}</span>
                          </div>
                          <hr className="my-2" />
                          <div className="flex justify-between text-lg">
                            <span>Total Payable:</span>
                            <span className="font-bold">KSh {loanDetails.totalPayable.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="eligibility">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Loan Eligibility</CardTitle>
                <CardDescription>Check your current loan eligibility status</CardDescription>
              </CardHeader>
              <CardContent>
                {eligibility && (
                  <div className="space-y-6">
                    <div className={`p-6 rounded-lg ${eligibility.eligible ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                      <div className="flex items-center mb-4">
                        {eligibility.eligible ? (
                          <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                        ) : (
                          <AlertCircle className="h-8 w-8 text-red-600 mr-3" />
                        )}
                        <h3 className="text-xl font-bold">
                          {eligibility.eligible ? 'You are eligible for a loan!' : 'Not eligible yet'}
                        </h3>
                      </div>
                      
                      {eligibility.eligible && (
                        <p className="text-lg text-green-700 dark:text-green-300">
                          Maximum loan amount: <strong>KSh {eligibility.maxAmount.toLocaleString()}</strong>
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 border rounded-lg">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm text-gray-600 dark:text-gray-300">Credit Score</p>
                        <p className="text-xl font-bold">{eligibility.currentCreditScore}</p>
                        <p className="text-xs text-gray-500">Required: {eligibility.minCreditScore}+</p>
                      </div>
                      
                      <div className="text-center p-4 border rounded-lg">
                        <Calendar className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <p className="text-sm text-gray-600 dark:text-gray-300">Contribution History</p>
                        <p className="text-xl font-bold">{eligibility.contributionHistory}</p>
                        <p className="text-xs text-gray-500">months</p>
                      </div>
                      
                      <div className="text-center p-4 border rounded-lg">
                        <Calculator className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                        <p className="text-sm text-gray-600 dark:text-gray-300">Max Loan</p>
                        <p className="text-xl font-bold">KSh {eligibility.maxAmount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">3x contributions</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Eligibility Details:</h4>
                      <ul className="space-y-2">
                        {eligibility.reasons.map((reason: string, index: number) => (
                          <li key={index} className="flex items-center">
                            {eligibility.eligible ? (
                              <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                            )}
                            <span className="text-sm">{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
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