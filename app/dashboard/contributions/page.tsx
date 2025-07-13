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
import { 
  Plus, 
  Download, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Smartphone,
  CreditCard as CreditCardIcon
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { authService } from '@/lib/auth';
import { db } from '@/lib/database';
import { CreditScoringService } from '@/lib/credit-scoring';

export default function ContributionsPage() {
  const [contributions, setContributions] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    method: 'mpesa',
    description: ''
  });
  const [stats, setStats] = useState({
    totalContributions: 0,
    thisMonth: 0,
    lastMonth: 0,
    averageMonthly: 0
  });

  const user = authService.getCurrentUser();

  useEffect(() => {
    if (!user) return;
    loadContributions();
  }, [user]);

  const loadContributions = () => {
    if (!user) return;
    
    const userContributions = db.getContributions(user.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setContributions(userContributions);
    calculateStats(userContributions);
  };

  const calculateStats = (contributions: any[]) => {
    const completed = contributions.filter(c => c.status === 'completed');
    const total = completed.reduce((sum, c) => sum + c.amount, 0);
    
    const now = new Date();
    const thisMonth = completed.filter(c => {
      const date = new Date(c.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).reduce((sum, c) => sum + c.amount, 0);
    
    const lastMonth = completed.filter(c => {
      const date = new Date(c.date);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
      return date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear();
    }).reduce((sum, c) => sum + c.amount, 0);
    
    const monthsWithContributions = new Set(completed.map(c => {
      const date = new Date(c.date);
      return `${date.getFullYear()}-${date.getMonth()}`;
    })).size;
    
    const average = monthsWithContributions > 0 ? total / monthsWithContributions : 0;
    
    setStats({
      totalContributions: total,
      thisMonth,
      lastMonth,
      averageMonthly: average
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const contribution = db.createContribution({
        memberId: user.id,
        amount: parseFloat(formData.amount),
        date: new Date().toISOString(),
        method: formData.method as 'mpesa' | 'bank',
        transactionRef: `TXN${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
        status: 'completed', // In real app, this would be 'pending' initially
        description: formData.description || `Monthly contribution via ${formData.method.toUpperCase()}`
      });
      
      // Update credit score
      CreditScoringService.updateCreditScore(user.id, 'New contribution received');
      
      // Create notification
      db.createNotification({
        userId: user.id,
        title: 'Contribution Successful',
        message: `Your contribution of KSh ${formData.amount} has been processed successfully.`,
        type: 'success',
        read: false,
        date: new Date().toISOString()
      });
      
      setIsDialogOpen(false);
      setFormData({ amount: '', method: 'mpesa', description: '' });
      loadContributions();
    } catch (error) {
      console.error('Contribution failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportContributions = () => {
    const csvContent = [
      'Date,Amount,Method,Status,Description',
      ...contributions.map(c => 
        `${new Date(c.date).toLocaleDateString()},${c.amount},${c.method},${c.status},"${c.description}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contributions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contributions</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Track and manage your monthly contributions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportContributions}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  New Contribution
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Make a Contribution</DialogTitle>
                  <DialogDescription>
                    Add funds to your SACCO account
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Amount (KSh)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="5000"
                      required
                      min="100"
                      step="1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="method">Payment Method</Label>
                    <Select value={formData.method} onValueChange={(value) => setFormData(prev => ({ ...prev, method: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mpesa">
                          <div className="flex items-center">
                            <Smartphone className="mr-2 h-4 w-4" />
                            M-Pesa
                          </div>
                        </SelectItem>
                        <SelectItem value="bank">
                          <div className="flex items-center">
                            <CreditCardIcon className="mr-2 h-4 w-4" />
                            Bank Transfer
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Monthly contribution"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Processing...' : 'Submit Contribution'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  KSh {stats.totalContributions.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Contributions</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  KSh {stats.thisMonth.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">This Month</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  KSh {stats.lastMonth.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Last Month</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  KSh {Math.round(stats.averageMonthly).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Monthly Average</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contributions Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Contribution History</CardTitle>
            <CardDescription>All your contributions and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {contributions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributions.map((contribution) => (
                    <TableRow key={contribution.id}>
                      <TableCell>
                        {new Date(contribution.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        KSh {contribution.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {contribution.method === 'mpesa' ? (
                            <Smartphone className="mr-2 h-4 w-4" />
                          ) : (
                            <CreditCardIcon className="mr-2 h-4 w-4" />
                          )}
                          {contribution.method.toUpperCase()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(contribution.status)}>
                          <div className="flex items-center">
                            {getStatusIcon(contribution.status)}
                            <span className="ml-1 capitalize">{contribution.status}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {contribution.transactionRef}
                      </TableCell>
                      <TableCell>{contribution.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No contributions yet
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Start building your savings by making your first contribution
                </p>
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Make First Contribution
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}