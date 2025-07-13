import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      membershipNumber: string;
      creditScore: number;
      isVerified: boolean;
    };
  }

  interface User {
    role: string;
    membershipNumber: string;
    creditScore: number;
    isVerified: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    membershipNumber: string;
    creditScore: number;
    isVerified: boolean;
  }
}