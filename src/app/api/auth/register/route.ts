import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+254\d{9}$/, 'Phone must be in format +254XXXXXXXXX'),
  idNumber: z.string().min(7, 'ID number must be at least 7 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Check if ID number already exists
    const existingId = await db
      .select()
      .from(users)
      .where(eq(users.idNumber, validatedData.idNumber))
      .limit(1);

    if (existingId.length > 0) {
      return NextResponse.json(
        { error: 'User with this ID number already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    // Generate membership number
    const membershipNumber = `JV${Date.now().toString().slice(-6)}`;

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        fullName: validatedData.fullName,
        email: validatedData.email,
        phone: validatedData.phone,
        idNumber: validatedData.idNumber,
        passwordHash,
        membershipNumber,
        role: 'member',
        creditScore: 300,
        isVerified: false,
      })
      .returning();

    // Remove password hash from response
    const { passwordHash: _, ...userResponse } = newUser[0];

    return NextResponse.json({
      message: 'User registered successfully',
      user: userResponse,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}