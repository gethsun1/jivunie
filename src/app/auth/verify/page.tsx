'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    // Simulate email verification
    setTimeout(() => {
      // In a real app, you would verify the token with your backend
      const isValidToken = token.length > 10; // Simple validation for demo
      
      if (isValidToken) {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      } else {
        setStatus('error');
        setMessage('Invalid or expired verification token');
      }
    }, 2000);
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl bg-white/80 backdrop-blur-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Email Verification</CardTitle>
          <CardDescription>
            Verifying your email address...
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'loading' && (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
              <p className="text-gray-600">Please wait while we verify your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-green-600 mb-2">
                  Verification Successful!
                </h3>
                <p className="text-gray-600 mb-4">{message}</p>
                <Link href="/auth/login">
                  <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                    Continue to Login
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-red-600 mb-2">
                  Verification Failed
                </h3>
                <p className="text-gray-600 mb-4">{message}</p>
                <div className="space-y-2">
                  <Link href="/auth/register">
                    <Button variant="outline" className="w-full">
                      Create New Account
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button variant="ghost" className="w-full">
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}