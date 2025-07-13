# Jivunie SACCO - Digital SACCO Platform

A comprehensive digital Savings and Credit Cooperative Organization (SACCO) platform built with modern web technologies.

## 🚀 Features

### Core Functionality
- **Member Management**: Secure registration, profile management, and role-based access control
- **Contributions**: Monthly contribution tracking with M-Pesa integration
- **Loan Management**: Automated loan eligibility, application workflow, and repayment tracking
- **Credit Scoring**: Dynamic credit scoring algorithm (300-850 scale)
- **Health Insurance**: Credit-score based insurance eligibility and coverage management
- **Admin Dashboard**: Comprehensive analytics, member management, and system oversight

### Technical Features
- **Authentication**: NextAuth.js with JWT tokens and email verification
- **Database**: PostgreSQL with Drizzle ORM
- **API**: RESTful APIs with OpenAPI/Swagger documentation
- **UI/UX**: Responsive design with TailwindCSS and Shadcn UI components
- **Testing**: Unit tests with Jest and React Testing Library
- **Logging**: Structured logging with Winston
- **Security**: Input validation, SQL injection prevention, and secure password hashing

## 🛠 Tech Stack

- **Frontend**: Next.js 13+ (App Router), React 18, TypeScript
- **Backend**: Node.js, Express.js (API routes)
- **Database**: PostgreSQL, Drizzle ORM
- **Authentication**: NextAuth.js
- **UI**: TailwindCSS, Shadcn UI, Lucide React Icons
- **Charts**: Recharts
- **Validation**: Zod
- **Testing**: Jest, React Testing Library
- **Documentation**: Swagger/OpenAPI

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Environment Variables
Create a `.env.local` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/jivunie_sacco"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# Email (Optional - for email verification)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@jivunie.co.ke"

# M-Pesa API (Optional - for production)
MPESA_CONSUMER_KEY="your-mpesa-consumer-key"
MPESA_CONSUMER_SECRET="your-mpesa-consumer-secret"
MPESA_ENVIRONMENT="sandbox" # or "production"
```

### Installation Steps

1. **Clone the repository**
```bash
git clone https://github.com/your-username/jivunie-sacco.git
cd jivunie-sacco
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up the database**
```bash
# Run database migrations
npm run db:migrate

# Optional: Start Drizzle Studio for database management
npm run db:studio
```

4. **Start the development server**
```bash
npm run dev
```

5. **Access the application**
- Main app: http://localhost:3000
- API docs: http://localhost:3000/docs

## 🏗 Project Structure

```
src/
├── app/                    # Next.js 13+ App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Member dashboard
│   ├── admin/             # Admin dashboard
│   └── docs/              # API documentation
├── components/            # React components
│   ├── ui/                # Shadcn UI components
│   └── layout/            # Layout components
├── db/                    # Database configuration
│   ├── schema.ts          # Database schema
│   └── migrate.ts         # Migration runner
├── lib/                   # Utility libraries
│   └── services/          # Business logic services
├── types/                 # TypeScript type definitions
└── __tests__/             # Test files
```

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📊 Credit Scoring Algorithm

The platform uses a sophisticated credit scoring algorithm:

### Base Score: 300

### Positive Factors:
- **On-time contributions**: +5 points each
- **Early loan repayments**: +10 points each  
- **Consistent saving pattern**: +3 points per month
- **Account tenure**: +2 points per month (max 60 points)

### Negative Factors:
- **Missed contributions**: -10 points each
- **Late loan repayments**: -15 points each
- **Loan defaults**: -50 points each

### Score Ranges:
- **750-850**: Excellent (8% interest rate)
- **700-749**: Very Good (10% interest rate)
- **650-699**: Good (12% interest rate)
- **600-649**: Fair (14% interest rate)
- **300-599**: Poor (16% interest rate)

## 💳 Loan Management

### Eligibility Criteria:
- Minimum 6 months of contribution history
- Credit score ≥ 400
- Maximum 2 active loans
- No recent defaults (90 days)

### Loan Limits:
- Maximum loan amount = 3x total contributions
- Term: 6-36 months
- Interest rates based on credit score

## 🏥 Insurance Integration

### Eligibility:
- Credit score > 700 required
- Three coverage tiers: Basic, Standard, Premium
- Family coverage options available

### Coverage Tiers:
- **Basic**: KSh 200,000 coverage, KSh 1,500/month
- **Standard**: KSh 500,000 coverage, KSh 2,500/month  
- **Premium**: KSh 1,000,000 coverage, KSh 4,000/month

## 👥 Demo Credentials

### Admin Access:
- **Email**: admin@jivunie.co.ke
- **Password**: admin123

### Member Access:
- **Email**: john.kamau@gmail.com
- **Password**: member123

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy automatically on push to main branch**

### Manual Deployment

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## 📈 API Documentation

Access the interactive API documentation at `/docs` when running the application.

### Key Endpoints:

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

#### Protected Routes
- `GET /api/protected/contributions` - Get user contributions
- `POST /api/protected/contributions` - Create contribution
- `GET /api/protected/loans` - Get user loans
- `POST /api/protected/loans` - Apply for loan
- `GET /api/protected/credit-score` - Get credit score

#### Admin Routes
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/members` - Manage members
- `POST /api/admin/loans/:id/approve` - Approve loan

## 🔒 Security Features

- **Authentication**: JWT-based authentication with NextAuth.js
- **Authorization**: Role-based access control (Member/Admin)
- **Input Validation**: Zod schema validation on all inputs
- **SQL Injection Prevention**: Parameterized queries with Drizzle ORM
- **Password Security**: bcrypt hashing with salt rounds
- **Rate Limiting**: API rate limiting (production ready)
- **CORS**: Configured Cross-Origin Resource Sharing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@jivunie.co.ke or create an issue in the GitHub repository.

## 🏆 Acknowledgments

- Built with ❤️ for the SACCO community
- Inspired by modern fintech solutions
- Designed for financial inclusion and empowerment

---

**Jivunie SACCO** - Empowering communities through digital financial cooperation.

---
*Last updated: 2025-01-13*