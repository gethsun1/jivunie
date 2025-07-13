'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { authService } from '@/lib/auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(authService.getCurrentUser());
  const router = useRouter();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }
    setUser(currentUser);
    setLoading(false);
  }, [router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}