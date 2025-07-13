import { db } from './database';
import { CreditScoringService } from './credit-scoring';

export function initializeSampleData() {
  // Check if data already exists
  const existingUsers = db.getUsers();
  if (existingUsers.length > 0) return;

  // Create sample admin user
  const admin = db.createUser({
    fullName: 'Sarah Wanjiku',
    email: 'admin@jivunie.co.ke',
    phone: '+254712345678',
    idNumber: '12345678',
    role: 'admin',
    isVerified: true,
  });

  // Create sample members
  const members = [
    {
      fullName: 'John Kamau',
      email: 'john.kamau@gmail.com',
      phone: '+254721123456',
      idNumber: '23456789',
      role: 'member' as const,
      isVerified: true,
    },
    {
      fullName: 'Mary Akinyi',
      email: 'mary.akinyi@gmail.com',
      phone: '+254733234567',
      idNumber: '34567890',
      role: 'member' as const,
      isVerified: true,
    },
    {
      fullName: 'Peter Mwangi',
      email: 'peter.mwangi@gmail.com',
      phone: '+254744345678',
      idNumber: '45678901',
      role: 'member' as const,
      isVerified: true,
    }
  ];

  const createdMembers = members.map(member => db.createUser(member));

  // Create sample contributions for each member
  createdMembers.forEach((member, memberIndex) => {
    // Create 8 months of contributions
    for (let i = 7; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      const baseAmount = 5000 + (memberIndex * 1000);
      const amount = baseAmount + (Math.random() * 1000);
      
      db.createContribution({
        memberId: member.id,
        amount: Math.round(amount),
        date: date.toISOString(),
        method: Math.random() > 0.5 ? 'mpesa' : 'bank',
        transactionRef: `TXN${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
        status: 'completed',
        description: `Monthly contribution for ${date.toLocaleString('default', { month: 'long', year: 'numeric' })}`
      });
    }

    // Create some loan history for first two members
    if (memberIndex < 2) {
      const totalContributions = db.getContributions(member.id)
        .filter(c => c.status === 'completed')
        .reduce((sum, c) => sum + c.amount, 0);
      
      const loanAmount = Math.round(totalContributions * 2); // 2x contributions
      const interestRate = 12;
      const term = 12;
      const monthlyPayment = Math.round((loanAmount * (interestRate/100/12) * Math.pow(1 + interestRate/100/12, term)) / 
                                      (Math.pow(1 + interestRate/100/12, term) - 1));
      
      const loan = db.createLoan({
        memberId: member.id,
        amount: loanAmount,
        interestRate,
        term,
        purpose: memberIndex === 0 ? 'Business expansion' : 'Home improvement',
        status: 'disbursed',
        applicationDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        approvalDate: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
        disbursementDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
        monthlyPayment,
        totalPayable: monthlyPayment * term,
        amountPaid: monthlyPayment * 2, // 2 payments made
        remainingBalance: loanAmount - (monthlyPayment * 2 * 0.8), // Accounting for interest
        nextPaymentDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Create some payment history
      for (let i = 0; i < 2; i++) {
        const paymentDate = new Date(Date.now() - (45 - i * 30) * 24 * 60 * 60 * 1000);
        db.createLoanPayment({
          loanId: loan.id,
          amount: monthlyPayment,
          date: paymentDate.toISOString(),
          method: 'mpesa',
          transactionRef: `LPN${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
          principal: Math.round(monthlyPayment * 0.8),
          interest: Math.round(monthlyPayment * 0.2),
          status: 'completed'
        });
      }
    }

    // Update credit scores based on contribution history
    CreditScoringService.updateCreditScore(member.id, 'Initial score calculation');
  });

  // Create sample notifications
  createdMembers.forEach(member => {
    db.createNotification({
      userId: member.id,
      title: 'Monthly Contribution Due',
      message: 'Your monthly contribution for this month is due in 5 days.',
      type: 'warning',
      read: false,
      date: new Date().toISOString(),
    });

    db.createNotification({
      userId: member.id,
      title: 'Credit Score Updated',
      message: 'Your credit score has been updated based on recent activity.',
      type: 'info',
      read: true,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    });
  });

  // Create insurance coverage for high-score members
  const highScoreMembers = createdMembers.filter(member => {
    const updatedMember = db.getUserById(member.id);
    return updatedMember && updatedMember.creditScore >= 700;
  });

  highScoreMembers.forEach(member => {
    db.createInsuranceCoverage({
      memberId: member.id,
      tier: 'standard',
      coverage: 500000,
      premium: 2500,
      dependents: 2,
      status: 'active',
      startDate: new Date().toISOString(),
      renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    });
  });

  console.log('Sample data initialized successfully');
}