'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Plus, 
  Users, 
  Heart,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Calendar,
  Star
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { authService } from '@/lib/auth';
import { db } from '@/lib/database';

const insuranceTiers = [
  {
    tier: 'basic',
    name: 'Basic Coverage',
    coverage: 200000,
    premium: 1500,
    minCreditScore: 500,
    features: [
      'Inpatient medical cover',
      'Emergency services',
      'Basic diagnostic tests',
      '1 dependent coverage'
    ]
  },
  {
    tier: 'standard',
    name: 'Standard Coverage',
    coverage: 500000,
    premium: 2500,
    minCreditScore: 650,
    features: [
      'Comprehensive medical cover',
      'Outpatient services',
      'Dental and optical',
      'Maternity cover',
      '3 dependents coverage',
      'Annual health checkup'
    ]
  },
  {
    tier: 'premium',
    name: 'Premium Coverage',
    coverage: 1000000,
    premium: 4000,
    minCreditScore: 750,
    features: [
      'Executive medical cover',
      'Specialist consultations',
      'Advanced diagnostics',
      'International emergency cover',
      '5 dependents coverage',
      'Wellness programs',
      'Alternative medicine',
      'Mental health support'
    ]
  }
];

export default function InsurancePage() {
  const [coverage, setCoverage] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState('');
  const [dependents, setDependents] = useState('1');
  const [loading, setLoading] = useState(false);
  const [eligibleTiers, setEligibleTiers] = useState<any[]>([]);

  const user = authService.getCurrentUser();

  useEffect(() => {
    if (!user) return;
    loadInsuranceCoverage();
    calculateEligibility();
  }, [user]);

  const loadInsuranceCoverage = () => {
    if (!user) return;
    
    const userCoverage = db.getInsuranceCoverage(user.id);
    setCoverage(userCoverage);
  };

  const calculateEligibility = () => {
    if (!user) return;
    
    const eligible = insuranceTiers.filter(tier => user.creditScore >= tier.minCreditScore);
    setEligibleTiers(eligible);
  };

  const handleSubscribe = async () => {
    if (!user || !selectedTier) return;
    
    setLoading(true);
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const tier = insuranceTiers.find(t => t.tier === selectedTier);
      if (!tier) return;
      
      const newCoverage = db.createInsuranceCoverage({
        memberId: user.id,
        tier: selectedTier as 'basic' | 'standard' | 'premium',
        coverage: tier.coverage,
        premium: tier.premium,
        dependents: parseInt(dependents),
        status: 'active',
        startDate: new Date().toISOString(),
        renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });
      
      // Create notification
      db.createNotification({
        userId: user.id,
        title: 'Insurance Coverage Activated',
        message: `Your ${tier.name} has been activated successfully. Coverage amount: KSh ${tier.coverage.toLocaleString()}`,
        type: 'success',
        read: false,
        date: new Date().toISOString()
      });
      
      setIsDialogOpen(false);
      loadInsuranceCoverage();
    } catch (error) {
      console.error('Insurance subscription failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilRenewal = (renewalDate: string) => {
    const renewal = new Date(renewalDate);
    const now = new Date();
    const diffTime = renewal.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (!user) return null;

  const hasActiveCoverage = coverage && coverage.status === 'active';
  const canSubscribe = user.creditScore >= 500;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Health Insurance</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Protect yourself and your family with our health coverage plans
            </p>
          </div>
          {!hasActiveCoverage && canSubscribe && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Subscribe to Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Subscribe to Health Insurance</DialogTitle>
                  <DialogDescription>
                    Choose a plan that fits your needs and budget
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <Label>Select Insurance Plan</Label>
                    <div className="grid gap-4 mt-2">
                      {eligibleTiers.map((tier) => (
                        <div
                          key={tier.tier}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            selectedTier === tier.tier
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedTier(tier.tier)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{tier.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                Coverage: KSh {tier.coverage.toLocaleString()}
                              </p>
                              <p className="text-sm font-medium text-green-600">
                                KSh {tier.premium.toLocaleString()}/month
                              </p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800">
                              {tier.tier.charAt(0).toUpperCase() + tier.tier.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="dependents">Number of Dependents</Label>
                    <Select value={dependents} onValueChange={setDependents}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No dependents</SelectItem>
                        <SelectItem value="1">1 dependent</SelectItem>
                        <SelectItem value="2">2 dependents</SelectItem>
                        <SelectItem value="3">3 dependents</SelectItem>
                        <SelectItem value="4">4 dependents</SelectItem>
                        <SelectItem value="5">5 dependents</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    onClick={handleSubscribe} 
                    className="w-full" 
                    disabled={loading || !selectedTier}
                  >
                    {loading ? 'Processing...' : 'Subscribe Now'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Eligibility Alert */}
        {!canSubscribe && (
          <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Insurance Eligibility:</strong> You need a credit score of at least 500 to be eligible for health insurance. 
              Your current score is {user.creditScore}. Keep making regular contributions to improve your score.
            </AlertDescription>
          </Alert>
        )}

        {/* Current Coverage */}
        {hasActiveCoverage && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <CardTitle className="text-xl">Active Coverage</CardTitle>
                    <CardDescription>
                      {insuranceTiers.find(t => t.tier === coverage.tier)?.name}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={getStatusColor(coverage.status)}>
                  {coverage.status.charAt(0).toUpperCase() + coverage.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">Coverage Amount</p>
                  <p className="text-xl font-bold">KSh {coverage.coverage.toLocaleString()}</p>
                </div>
                
                <div className="text-center">
                  <CreditCard className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">Monthly Premium</p>
                  <p className="text-xl font-bold">KSh {coverage.premium.toLocaleString()}</p>
                </div>
                
                <div className="text-center">
                  <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">Dependents Covered</p>
                  <p className="text-xl font-bold">{coverage.dependents}</p>
                </div>
                
                <div className="text-center">
                  <Calendar className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">Renewal Date</p>
                  <p className="text-xl font-bold">
                    {getDaysUntilRenewal(coverage.renewalDate)} days
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>Coverage Period Progress</span>
                  <span>{Math.round((365 - getDaysUntilRenewal(coverage.renewalDate)) / 365 * 100)}%</span>
                </div>
                <Progress value={(365 - getDaysUntilRenewal(coverage.renewalDate)) / 365 * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Plans */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Available Insurance Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insuranceTiers.map((tier) => {
              const isEligible = user.creditScore >= tier.minCreditScore;
              const isCurrentPlan = coverage?.tier === tier.tier;
              
              return (
                <Card 
                  key={tier.tier}
                  className={`border-0 shadow-lg relative ${
                    isCurrentPlan ? 'ring-2 ring-green-500' : ''
                  } ${
                    tier.tier === 'standard' ? 'border-2 border-blue-500' : ''
                  }`}
                >
                  {tier.tier === 'standard' && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white flex items-center px-3 py-1">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4">
                      <Badge className="bg-green-500 text-white">Current Plan</Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                    <div className="text-3xl font-bold text-green-600">
                      KSh {tier.premium.toLocaleString()}
                      <span className="text-sm text-gray-600 dark:text-gray-300">/month</span>
                    </div>
                    <CardDescription>
                      Coverage up to KSh {tier.coverage.toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Required Credit Score:</span>
                        <span className={isEligible ? 'text-green-600' : 'text-red-600'}>
                          {tier.minCreditScore}+
                        </span>
                      </div>
                      
                      {!isEligible && (
                        <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                          Your score: {user.creditScore} (Need {tier.minCreditScore - user.creditScore} more points)
                        </div>
                      )}
                      
                      {isCurrentPlan ? (
                        <Button disabled className="w-full">
                          Current Plan
                        </Button>
                      ) : isEligible ? (
                        <Button 
                          className="w-full"
                          onClick={() => {
                            setSelectedTier(tier.tier);
                            setIsDialogOpen(true);
                          }}
                          disabled={hasActiveCoverage}
                        >
                          {hasActiveCoverage ? 'Already Subscribed' : 'Choose Plan'}
                        </Button>
                      ) : (
                        <Button disabled className="w-full">
                          Not Eligible
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Benefits Information */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Why Choose Our Health Insurance?</CardTitle>
            <CardDescription>Comprehensive protection for you and your family</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-medium mb-2">Comprehensive Coverage</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Full medical protection including inpatient, outpatient, and emergency services
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-medium mb-2">Family Protection</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Extend coverage to your dependents with our family-friendly plans
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-medium mb-2">Easy Claims</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Streamlined claims process with quick approvals and direct payments
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="h-6 w-6 text-orange-600" />
                </div>
                <h4 className="font-medium mb-2">Premium Benefits</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Access to top-tier hospitals and specialist care nationwide
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}