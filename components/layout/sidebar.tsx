'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Building, 
  LayoutDashboard, 
  Banknote, 
  CreditCard, 
  TrendingUp, 
  Shield, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Users,
  BarChart3,
  FileText
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  className?: string;
}

const memberNavigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Contributions',
    href: '/dashboard/contributions',
    icon: Banknote,
  },
  {
    name: 'Loans',
    href: '/dashboard/loans',
    icon: CreditCard,
  },
  {
    name: 'Credit Score',
    href: '/dashboard/credit-score',
    icon: TrendingUp,
  },
  {
    name: 'Insurance',
    href: '/dashboard/insurance',
    icon: Shield,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

const adminNavigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Members',
    href: '/admin/members',
    icon: Users,
  },
  {
    name: 'Loans',
    href: '/admin/loans',
    icon: CreditCard,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: FileText,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const user = authService.getCurrentUser();
  const isAdmin = authService.isAdmin();
  
  const navigation = isAdmin ? adminNavigation : memberNavigation;

  const handleLogout = () => {
    authService.logout();
    router.push('/');
  };

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 z-50 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300",
        collapsed ? "-translate-x-full lg:w-16" : "w-64",
        className
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            {!collapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="font-semibold text-gray-900 dark:text-white">Jivunie SACCO</h1>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {isAdmin ? 'Admin Panel' : 'Member Portal'}
                  </p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="lg:hidden"
            >
              {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>
          </div>

          {/* User Info */}
          {!collapsed && user && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {user.fullName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                    {user.membershipNumber}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      isActive
                        ? "bg-gradient-to-r from-green-600 to-blue-600 text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                      collapsed && "justify-center"
                    )}
                    onClick={() => setCollapsed(true)}
                  >
                    <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                    {!collapsed && item.name}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Logout */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className={cn(
                "w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600",
                collapsed && "justify-center"
              )}
            >
              <LogOut className={cn("h-5 w-5", !collapsed && "mr-3")} />
              {!collapsed && "Logout"}
            </Button>
          </div>
        </div>
      </div>

      {/* Toggle button for desktop */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <Menu className="h-4 w-4" />
      </Button>
    </>
  );
}