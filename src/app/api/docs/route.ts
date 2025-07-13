import { NextRequest, NextResponse } from 'next/server';
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Jivunie SACCO API',
      version: '1.0.0',
      description: 'Digital SACCO platform API documentation',
    },
    servers: [
      {
        url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string' },
            fullName: { type: 'string' },
            phone: { type: 'string' },
            membershipNumber: { type: 'string' },
            creditScore: { type: 'integer' },
            isVerified: { type: 'boolean' },
            role: { type: 'string', enum: ['member', 'admin'] },
          },
        },
        Contribution: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            amount: { type: 'string' },
            method: { type: 'string', enum: ['mpesa', 'bank', 'cash'] },
            status: { type: 'string', enum: ['pending', 'completed', 'failed'] },
            transactionRef: { type: 'string' },
            description: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Loan: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            amount: { type: 'string' },
            interestRate: { type: 'string' },
            term: { type: 'integer' },
            purpose: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'disbursed', 'completed'] },
            monthlyPayment: { type: 'string' },
            totalPayable: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/app/api/**/*.ts'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

export async function GET(request: NextRequest) {
  return NextResponse.json(specs);
}