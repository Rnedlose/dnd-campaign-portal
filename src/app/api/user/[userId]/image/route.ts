import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  const session = await getServerSession(authOptions);
  const { userId } = await context.params;

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Only allow users to update their own image
  if (session.user.id !== userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { image } = await request.json();

    if (!image) {
      return new NextResponse('No image URL provided', { status: 400 });
    }

    // Update user profile with new image URL
    await prisma.user.update({
      where: { id: userId },
      data: { image },
    });

    return NextResponse.json({ image });
  } catch (error) {
    console.error('Error updating image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
