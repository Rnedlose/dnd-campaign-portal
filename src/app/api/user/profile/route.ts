import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { name, bio, newPassword } = await req.json();

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (newPassword) {
      updateData.password = await hash(newPassword, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
      bio: updatedUser.bio,
    });
  } catch (error) {
    console.error('[PROFILE_UPDATE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
