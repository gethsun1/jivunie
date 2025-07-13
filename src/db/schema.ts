import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  decimal,
  integer,
  boolean,
  json,
  pgEnum,
} from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('user_role', ['member', 'admin']);
export const contributionStatusEnum = pgEnum('contribution_status', ['pending', 'completed', 'failed']);
export const contributionMethodEnum = pgEnum('contribution_method', ['mpesa', 'bank', 'cash']);
export const loanStatusEnum = pgEnum('loan_status', ['pending', 'approved', 'rejected', 'disbursed', 'completed']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed']);
export const insuranceTierEnum = pgEnum('insurance_tier', ['basic', 'standard', 'premium']);
export const insuranceStatusEnum = pgEnum('insurance_status', ['active', 'suspended', 'expired']);
export const notificationTypeEnum = pgEnum('notification_type', ['info', 'success', 'warning', 'error']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  idNumber: varchar('id_number', { length: 50 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }).notNull(),
  profilePhoto: text('profile_photo'),
  role: userRoleEnum('role').default('member').notNull(),
  passwordHash: text('password_hash').notNull(),
  creditScore: integer('credit_score').default(300).notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  membershipNumber: varchar('membership_number', { length: 20 }).unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Contributions table
export const contributions = pgTable('contributions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  method: contributionMethodEnum('method').notNull(),
  transactionRef: varchar('transaction_ref', { length: 100 }).notNull(),
  status: contributionStatusEnum('status').default('pending').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// Loans table
export const loans = pgTable('loans', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  interestRate: decimal('interest_rate', { precision: 5, scale: 2 }).notNull(),
  term: integer('term').notNull(), // months
  purpose: varchar('purpose', { length: 100 }).notNull(),
  status: loanStatusEnum('status').default('pending').notNull(),
  monthlyPayment: decimal('monthly_payment', { precision: 12, scale: 2 }).notNull(),
  totalPayable: decimal('total_payable', { precision: 12, scale: 2 }).notNull(),
  amountPaid: decimal('amount_paid', { precision: 12, scale: 2 }).default('0').notNull(),
  remainingBalance: decimal('remaining_balance', { precision: 12, scale: 2 }).notNull(),
  guarantors: json('guarantors'),
  applicationDate: timestamp('application_date').defaultNow().notNull(),
  approvalDate: timestamp('approval_date'),
  disbursementDate: timestamp('disbursement_date'),
  nextPaymentDate: timestamp('next_payment_date'),
});

// Loan payments table
export const loanPayments = pgTable('loan_payments', {
  id: serial('id').primaryKey(),
  loanId: integer('loan_id').references(() => loans.id).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  principal: decimal('principal', { precision: 12, scale: 2 }).notNull(),
  interest: decimal('interest', { precision: 12, scale: 2 }).notNull(),
  method: contributionMethodEnum('method').notNull(),
  transactionRef: varchar('transaction_ref', { length: 100 }).notNull(),
  status: paymentStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// Credit score history table
export const creditScoreHistory = pgTable('credit_score_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  score: integer('score').notNull(),
  change: integer('change').notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Insurance coverage table
export const insuranceCoverage = pgTable('insurance_coverage', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  tier: insuranceTierEnum('tier').notNull(),
  coverage: decimal('coverage', { precision: 12, scale: 2 }).notNull(),
  premium: decimal('premium', { precision: 12, scale: 2 }).notNull(),
  dependents: integer('dependents').default(0).notNull(),
  status: insuranceStatusEnum('status').default('active').notNull(),
  startDate: timestamp('start_date').defaultNow().notNull(),
  renewalDate: timestamp('renewal_date').notNull(),
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: notificationTypeEnum('type').default('info').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  actionUrl: text('action_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  contributions: many(contributions),
  loans: many(loans),
  creditScoreHistory: many(creditScoreHistory),
  insuranceCoverage: many(insuranceCoverage),
  notifications: many(notifications),
}));

export const contributionsRelations = relations(contributions, ({ one }) => ({
  user: one(users, {
    fields: [contributions.userId],
    references: [users.id],
  }),
}));

export const loansRelations = relations(loans, ({ one, many }) => ({
  user: one(users, {
    fields: [loans.userId],
    references: [users.id],
  }),
  payments: many(loanPayments),
}));

export const loanPaymentsRelations = relations(loanPayments, ({ one }) => ({
  loan: one(loans, {
    fields: [loanPayments.loanId],
    references: [loans.id],
  }),
}));

export const creditScoreHistoryRelations = relations(creditScoreHistory, ({ one }) => ({
  user: one(users, {
    fields: [creditScoreHistory.userId],
    references: [users.id],
  }),
}));

export const insuranceCoverageRelations = relations(insuranceCoverage, ({ one }) => ({
  user: one(users, {
    fields: [insuranceCoverage.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));