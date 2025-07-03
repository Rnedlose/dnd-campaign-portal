import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // Validate required fields
    if (!name || !email || !password) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new NextResponse('Invalid email format', { status: 400 });
    }

    // Validate password strength
    if (password.length < 8) {
      return new NextResponse('Password must be at least 8 characters long', { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse('User already exists', { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with all required fields
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'user',
        theme: 'system',
      },
    });

    // Return user data without sensitive information
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
