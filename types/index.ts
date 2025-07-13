export interface User {
  id: string;
  email: string;
  fullName: string;
  idNumber: string;
  phone: string;
  profilePhoto?: string;
  role: 'member' | 'admin';
  creditScore: number;
  joinDate: string;
  isVerified: boolean;
  membershipNumber: string;
}

export interface Contribution {
  id: string;
  memberId: string;
  amount: number;
  date: string;
  method: 'mpesa' | 'bank' | 'cash';
  transactionRef: string;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
}

export interface Loan {
  id: string;
  memberId: string;
  amount: number;
  interestRate: number;
  term: number; // months
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed' | 'completed';
  applicationDate: string;
  approvalDate?: string;
  disbursementDate?: string;
  monthlyPayment: number;
  totalPayable: number;
  amountPaid: number;
  remainingBalance: number;
  nextPaymentDate?: string;
  guarantors?: string[];
}

export interface LoanPayment {
  id: string;
  loanId: string;
  amount: number;
  date: string;
  method: 'mpesa' | 'bank' | 'cash';
  transactionRef: string;
  principal: number;
  interest: number;
  status: 'pending' | 'completed' | 'failed';
}

export interface CreditScoreHistory {
  id: string;
  memberId: string;
  score: number;
  change: number;
  reason: string;
  date: string;
}

export interface InsuranceCoverage {
  id: string;
  memberId: string;
  tier: 'basic' | 'standard' | 'premium';
  coverage: number;
  premium: number;
  dependents: number;
  status: 'active' | 'suspended' | 'expired';
  startDate: string;
  renewalDate: string;
}

export interface PaymentMethod {
  id: string;
  type: 'mpesa' | 'bank';
  identifier: string; // phone number for M-Pesa, account number for bank
  isDefault: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  date: string;
  action?: {
    label: string;
    url: string;
  };
}

export interface DashboardStats {
  totalMembers: number;
  totalSavings: number;
  totalLoans: number;
  defaultRate: number;
  monthlyGrowth: {
    members: number;
    savings: number;
    loans: number;
  };
}

export interface LoanEligibility {
  eligible: boolean;
  maxAmount: number;
  minCreditScore: number;
  currentCreditScore: number;
  contributionHistory: number; // months
  reasons: string[];
}