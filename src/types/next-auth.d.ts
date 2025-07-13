import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      membershipNumber: string | null;
      creditScore: number;
      isVerified: boolean;
      phone?: string;
    };
  }

  interface User {
    role: string;
    membershipNumber: string | null;
    creditScore: number;
    isVerified: boolean;
    phone?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    membershipNumber: string | null;
    creditScore: number;
    isVerified: boolean;
    phone?: string;
  }
}