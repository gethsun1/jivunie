'use client';

import { User, Contribution, Loan, LoanPayment, CreditScoreHistory, InsuranceCoverage, Notification } from '@/types';

// Mock database using localStorage for demonstration
class Database {
  private storage = typeof window !== 'undefined' ? localStorage : null;

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private get<T>(key: string): T[] {
    if (!this.storage) return [];
    try {
      const data = this.storage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading from localStorage for key ${key}:`, error);
      return [];
    }
  }

  private set<T>(key: string, data: T[]): void {
    if (!this.storage) return;
    try {
      this.storage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error writing to localStorage for key ${key}:`, error);
    }
  }

  // Users
  getUsers(): User[] {
    return this.get<User>('users');
  }

  getUserById(id: string): User | null {
    const users = this.getUsers();
    return users.find(user => user.id === id) || null;
  }

  getUserByEmail(email: string): User | null {
    const users = this.getUsers();
    return users.find(user => user.email === email) || null;
  }

  createUser(userData: Omit<User, 'id' | 'creditScore' | 'joinDate' | 'membershipNumber'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...userData,
      id: this.generateId(),
      creditScore: 300, // Base credit score
      joinDate: new Date().toISOString(),
      membershipNumber: `JV${Date.now().toString().slice(-6)}`,
    };
    users.push(newUser);
    this.set('users', users);
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const users = this.getUsers();
    const index = users.findIndex(user => user.id === id);
    if (index === -1) return null;
    
    users[index] = { ...users[index], ...updates };
    this.set('users', users);
    return users[index];
  }

  // Contributions
  getContributions(memberId?: string): Contribution[] {
    const contributions = this.get<Contribution>('contributions');
    return memberId ? contributions.filter(c => c.memberId === memberId) : contributions;
  }

  createContribution(contributionData: Omit<Contribution, 'id'>): Contribution {
    const contributions = this.getContributions();
    const newContribution: Contribution = {
      ...contributionData,
      id: this.generateId(),
    };
    contributions.push(newContribution);
    this.set('contributions', contributions);
    return newContribution;
  }

  updateContribution(id: string, updates: Partial<Contribution>): Contribution | null {
    const contributions = this.getContributions();
    const index = contributions.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    contributions[index] = { ...contributions[index], ...updates };
    this.set('contributions', contributions);
    return contributions[index];
  }

  // Loans
  getLoans(memberId?: string): Loan[] {
    const loans = this.get<Loan>('loans');
    return memberId ? loans.filter(l => l.memberId === memberId) : loans;
  }

  createLoan(loanData: Omit<Loan, 'id'>): Loan {
    const loans = this.getLoans();
    const newLoan: Loan = {
      ...loanData,
      id: this.generateId(),
    };
    loans.push(newLoan);
    this.set('loans', loans);
    return newLoan;
  }

  updateLoan(id: string, updates: Partial<Loan>): Loan | null {
    const loans = this.getLoans();
    const index = loans.findIndex(l => l.id === id);
    if (index === -1) return null;
    
    loans[index] = { ...loans[index], ...updates };
    this.set('loans', loans);
    return loans[index];
  }

  // Loan Payments
  getLoanPayments(loanId?: string): LoanPayment[] {
    const payments = this.get<LoanPayment>('loanPayments');
    return loanId ? payments.filter(p => p.loanId === loanId) : payments;
  }

  createLoanPayment(paymentData: Omit<LoanPayment, 'id'>): LoanPayment {
    const payments = this.getLoanPayments();
    const newPayment: LoanPayment = {
      ...paymentData,
      id: this.generateId(),
    };
    payments.push(newPayment);
    this.set('loanPayments', payments);
    return newPayment;
  }

  // Credit Score History
  getCreditScoreHistory(memberId: string): CreditScoreHistory[] {
    const history = this.get<CreditScoreHistory>('creditScoreHistory');
    return history.filter(h => h.memberId === memberId);
  }

  addCreditScoreEntry(memberId: string, score: number, change: number, reason: string): CreditScoreHistory {
    const history = this.get<CreditScoreHistory>('creditScoreHistory');
    const newEntry: CreditScoreHistory = {
      id: this.generateId(),
      memberId,
      score,
      change,
      reason,
      date: new Date().toISOString(),
    };
    history.push(newEntry);
    this.set('creditScoreHistory', history);
    return newEntry;
  }

  // Insurance Coverage
  getInsuranceCoverage(memberId: string): InsuranceCoverage | null {
    const coverages = this.get<InsuranceCoverage>('insuranceCoverages');
    return coverages.find(c => c.memberId === memberId) || null;
  }

  createInsuranceCoverage(coverageData: Omit<InsuranceCoverage, 'id'>): InsuranceCoverage {
    const coverages = this.get<InsuranceCoverage>('insuranceCoverages');
    const newCoverage: InsuranceCoverage = {
      ...coverageData,
      id: this.generateId(),
    };
    coverages.push(newCoverage);
    this.set('insuranceCoverages', coverages);
    return newCoverage;
  }

  // Notifications
  getNotifications(userId: string): Notification[] {
    const notifications = this.get<Notification>('notifications');
    return notifications.filter(n => n.userId === userId);
  }

  createNotification(notificationData: Omit<Notification, 'id'>): Notification {
    const notifications = this.get<Notification>('notifications');
    const newNotification: Notification = {
      ...notificationData,
      id: this.generateId(),
    };
    notifications.push(newNotification);
    this.set('notifications', notifications);
    return newNotification;
  }

  markNotificationAsRead(id: string): boolean {
    const notifications = this.get<Notification>('notifications');
    const index = notifications.findIndex(n => n.id === id);
    if (index === -1) return false;
    
    notifications[index].read = true;
    this.set('notifications', notifications);
    return true;
  }
}

export const db = new Database();