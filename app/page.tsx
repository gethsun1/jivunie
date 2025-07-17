'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Banknote, CreditCard, Shield, TrendingUp, Users, Building } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Banknote,
    title: 'Smart Contributions',
    description: 'Track monthly contributions with automated M-Pesa integration',
    stats: '99.8% uptime'
  },
  {
    icon: CreditCard,
    title: 'Intelligent Loans',
    description: 'AI-powered loan eligibility with instant approval decisions',
    stats: '2-hour processing'
  },
  {
    icon: Shield,
    title: 'Health Insurance',
    description: 'Credit-based insurance eligibility with family coverage',
    stats: '700+ score required'
  },
  {
    icon: TrendingUp,
    title: 'Credit Scoring',
    description: 'Dynamic credit scoring with real-time updates',
    stats: '300-850 scale'
  }
];

const stats = [
  { label: 'Active Members', value: '2,847', change: '+12%' },
  { label: 'Total Savings', value: 'KSh 14.2M', change: '+8.3%' },
  { label: 'Loans Disbursed', value: 'KSh 8.7M', change: '+23%' },
  { label: 'Default Rate', value: '2.1%', change: '-0.8%' }
];

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white dark:from-gray-900 dark:via-green-900/20 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Jivunie SACCO</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Digital Financial Cooperative</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/auth/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                  Join SACCO
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
            Regulated by SASRA
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Your Digital Financial
            <br />
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Cooperative Partner
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Join thousands of members saving, borrowing, and building wealth together through our 
            modern digital SACCO platform with AI-powered credit scoring and instant loan processing.
          </p>
          <div className="flex items-center justify-center space-x-4 mb-12">
            <Link href="/auth/register">
              <Button size="lg" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                Start Saving Today
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline">
                Try with Demo Account
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white/60 backdrop-blur-sm dark:bg-gray-800/60">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">{stat.label}</div>
                  <div className="text-xs text-green-600 dark:text-green-400">{stat.change} this month</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50 dark:bg-gray-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features for Modern Banking
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our platform combines traditional SACCO values with cutting-edge technology
              to provide you with the best financial services.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="text-xs">{feature.stats}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Process Flow */}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
              Simple 3-Step Process
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">1</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Register & Verify</h4>
                <p className="text-gray-600 dark:text-gray-300">Create your account and verify your identity securely</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">2</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Start Contributing</h4>
                <p className="text-gray-600 dark:text-gray-300">Make monthly contributions via M-Pesa or bank transfer</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">3</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Access Loans</h4>
                <p className="text-gray-600 dark:text-gray-300">Apply for loans up to 3x your total contributions</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <Card className="max-w-4xl mx-auto border-0 shadow-2xl bg-gradient-to-r from-green-600 to-blue-600">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Transform Your Financial Future?
              </h2>
              <p className="text-xl text-green-100 mb-8">
                Join Jivunie SACCO today and start building wealth with our innovative digital platform.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/auth/register">
                  <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 w-full sm:w-auto">
                    Join Now - It's Free
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold">Jivunie SACCO</span>
              </div>
              <p className="text-gray-400">
                Empowering communities through digital financial cooperation.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Savings Accounts</li>
                <li>Instant Loans</li>
                <li>Health Insurance</li>
                <li>Investment Plans</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>API Documentation</li>
                <li>Status Page</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Compliance</li>
                <li>SASRA License</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Jivunie SACCO. All rights reserved. Licensed by SASRA.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}