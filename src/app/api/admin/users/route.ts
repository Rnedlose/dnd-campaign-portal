import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

// GET /api/admin/users - Get all users
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session?.user?.role || session.user.role !== 'admin') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PATCH /api/admin/users - Update user role
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session?.user?.role || session.user.role !== 'admin') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { userId, role } = await req.json();

    if (!userId || !role || !['admin', 'user'].includes(role)) {
      return new NextResponse('Invalid request', { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE /api/admin/users - Delete a user
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session?.user?.role || session.user.role !== 'admin') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new NextResponse('Invalid request', { status: 400 });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
