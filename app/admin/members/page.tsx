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
import { 
  Users, 
  Plus, 
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Banknote,
  CreditCard,
  Calendar,
  Phone,
  Mail,
  User,
  Shield
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { authService } from '@/lib/auth';
import { db } from '@/lib/database';
import { CreditScoringService } from '@/lib/credit-scoring';

export default function AdminMembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    totalMembers: 0,
    verifiedMembers: 0,
    activeMembers: 0,
    averageCreditScore: 0,
    totalContributions: 0
  });

  const user = authService.getCurrentUser();

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    loadMembers();
  }, [user]);

  useEffect(() => {
    filterMembers();
  }, [members, searchTerm, statusFilter]);

  const loadMembers = () => {
    const allUsers = db.getUsers().filter(u => u.role === 'member');
    
    // Enrich member data with financial information
    const enrichedMembers = allUsers.map(member => {
      const contributions = db.getContributions(member.id).filter(c => c.status === 'completed');
      const loans = db.getLoans(member.id);
      const activeLoans = loans.filter(l => l.status === 'disbursed' && l.remainingBalance > 0);
      
      const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);
      const totalLoans = activeLoans.reduce((sum, l) => sum + l.remainingBalance, 0);
      const lastContribution = contributions.length > 0 
        ? contributions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        : null;

      return {
        ...member,
        totalContributions,
        totalLoans,
        activeLoansCount: activeLoans.length,
        lastContributionDate: lastContribution?.date,
        contributionsCount: contributions.length,
        isActive: lastContribution && new Date(lastContribution.date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      };
    });

    setMembers(enrichedMembers);
    calculateStats(enrichedMembers);
  };

  const calculateStats = (membersList: any[]) => {
    const totalMembers = membersList.length;
    const verifiedMembers = membersList.filter(m => m.isVerified).length;
    const activeMembers = membersList.filter(m => m.isActive).length;
    const averageCreditScore = membersList.length > 0 
      ? membersList.reduce((sum, m) => sum + m.creditScore, 0) / membersList.length 
      : 0;
    const totalContributions = membersList.reduce((sum, m) => sum + m.totalContributions, 0);

    setStats({
      totalMembers,
      verifiedMembers,
      activeMembers,
      averageCreditScore: Math.round(averageCreditScore),
      totalContributions
    });
  };

  const filterMembers = () => {
    let filtered = members;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.membershipNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone.includes(searchTerm)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'verified':
          filtered = filtered.filter(m => m.isVerified);
          break;
        case 'unverified':
          filtered = filtered.filter(m => !m.isVerified);
          break;
        case 'active':
          filtered = filtered.filter(m => m.isActive);
          break;
        case 'inactive':
          filtered = filtered.filter(m => !m.isActive);
          break;
      }
    }

    setFilteredMembers(filtered);
  };

  const handleViewMember = (member: any) => {
    setSelectedMember(member);
    setIsViewDialogOpen(true);
  };

  const handleEditMember = (member: any) => {
    setSelectedMember(member);
    setIsEditDialogOpen(true);
  };

  const handleVerifyMember = (memberId: string) => {
    db.updateUser(memberId, { isVerified: true });
    
    // Create notification
    db.createNotification({
      userId: memberId,
      title: 'Account Verified',
      message: 'Your account has been verified by an administrator. You can now access all SACCO features.',
      type: 'success',
      read: false,
      date: new Date().toISOString()
    });

    loadMembers();
  };

  const handleSuspendMember = (memberId: string) => {
    db.updateUser(memberId, { isVerified: false });
    
    // Create notification
    db.createNotification({
      userId: memberId,
      title: 'Account Suspended',
      message: 'Your account has been suspended. Please contact support for assistance.',
      type: 'error',
      read: false,
      date: new Date().toISOString()
    });

    loadMembers();
  };

  const exportMembers = () => {
    const csvContent = [
      'Name,Email,Phone,Membership Number,Join Date,Credit Score,Total Contributions,Active Loans,Status',
      ...filteredMembers.map(m => 
        `"${m.fullName}","${m.email}","${m.phone}","${m.membershipNumber}","${new Date(m.joinDate).toLocaleDateString()}",${m.creditScore},${m.totalContributions},${m.activeLoansCount},"${m.isVerified ? 'Verified' : 'Unverified'}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getCreditScoreColor = (score: number) => {
    if (score >= 750) return 'text-green-600 bg-green-100';
    if (score >= 700) return 'text-blue-600 bg-blue-100';
    if (score >= 650) return 'text-yellow-600 bg-yellow-100';
    if (score >= 600) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  if (!user || user.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h2>
            <p className="text-gray-600 dark:text-gray-300">You don't have permission to access member management.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Member Management</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage member accounts, verification, and financial data
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportMembers}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Members</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalMembers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Verified</p>
                  <p className="text-2xl font-bold text-green-600">{stats.verifiedMembers}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Active</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.activeMembers}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Avg Credit Score</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.averageCreditScore}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Savings</p>
                  <p className="text-2xl font-bold text-green-600">
                    KSh {(stats.totalContributions / 1000000).toFixed(1)}M
                  </p>
                </div>
                <Banknote className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search members by name, email, phone, or membership number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Members ({filteredMembers.length})</CardTitle>
            <CardDescription>Comprehensive member overview and management</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredMembers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Membership #</TableHead>
                    <TableHead>Credit Score</TableHead>
                    <TableHead>Contributions</TableHead>
                    <TableHead>Active Loans</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {member.fullName.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{member.fullName}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">{member.email}</div>
                            <div className="text-xs text-gray-500">{member.phone}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {member.membershipNumber}
                      </TableCell>
                      <TableCell>
                        <Badge className={getCreditScoreColor(member.creditScore)}>
                          {member.creditScore}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">KSh {member.totalContributions.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{member.contributionsCount} payments</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.activeLoansCount > 0 ? (
                          <div>
                            <div className="font-medium">{member.activeLoansCount}</div>
                            <div className="text-xs text-gray-500">KSh {member.totalLoans.toLocaleString()}</div>
                          </div>
                        ) : (
                          <span className="text-gray-500">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge className={member.isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {member.isVerified ? 'Verified' : 'Unverified'}
                          </Badge>
                          <Badge className={member.isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                            {member.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.lastContributionDate ? (
                          <div className="text-sm">
                            {new Date(member.lastContributionDate).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">No activity</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewMember(member)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditMember(member)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {member.isVerified ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSuspendMember(member.id)}
                            >
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerifyMember(member.id)}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No members found
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'No members have registered yet'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Member Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Member Details</DialogTitle>
              <DialogDescription>
                Comprehensive member information and financial history
              </DialogDescription>
            </DialogHeader>
            {selectedMember && (
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium">{selectedMember.fullName}</p>
                          <p className="text-sm text-gray-600">Full Name</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium">{selectedMember.email}</p>
                          <p className="text-sm text-gray-600">Email Address</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium">{selectedMember.phone}</p>
                          <p className="text-sm text-gray-600">Phone Number</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium">{selectedMember.idNumber}</p>
                          <p className="text-sm text-gray-600">ID Number</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium">{new Date(selectedMember.joinDate).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-600">Join Date</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Financial Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">
                            KSh {selectedMember.totalContributions.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">Total Contributions</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{selectedMember.creditScore}</p>
                          <p className="text-sm text-gray-600">Credit Score</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">{selectedMember.activeLoansCount}</p>
                          <p className="text-sm text-gray-600">Active Loans</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <p className="text-2xl font-bold text-orange-600">
                            KSh {selectedMember.totalLoans.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">Outstanding Debt</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Account Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Account Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge className={selectedMember.isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {selectedMember.isVerified ? 'Verified' : 'Unverified'}
                          </Badge>
                          <Badge className={selectedMember.isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                            {selectedMember.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Membership Number: <span className="font-mono">{selectedMember.membershipNumber}</span>
                        </p>
                      </div>
                      <div className="space-x-2">
                        {selectedMember.isVerified ? (
                          <Button variant="destructive" onClick={() => handleSuspendMember(selectedMember.id)}>
                            Suspend Account
                          </Button>
                        ) : (
                          <Button onClick={() => handleVerifyMember(selectedMember.id)}>
                            Verify Account
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}