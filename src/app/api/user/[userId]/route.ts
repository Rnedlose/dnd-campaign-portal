import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, context: any) {
  const session = await getServerSession(authOptions);
  const userId = (await context.params).userId;

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
      },
    });

    if (!user) {
      return new NextResponse('Not found', { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('[USER_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function PATCH(request: Request, context: any) {
  const session = await getServerSession(authOptions);
  const userId = (await context.params).userId;

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (session.user.id !== userId) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, email, bio } = body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        bio,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('[USER_PATCH]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
