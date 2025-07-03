import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

export async function PATCH(req: Request, context: any) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Check if user is GM of the campaign
    const member = await prisma.campaignMember.findUnique({
      where: {
        campaignId_userId: {
          campaignId: (await context.params).campaignId,
          userId: session.user.id,
        },
      },
    });

    if (!member || member.role !== 'GM') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { gmOnly } = await req.json();

    if (typeof gmOnly !== 'boolean') {
      return new NextResponse('gmOnly must be a boolean', { status: 400 });
    }

    const note = await prisma.note.update({
      where: { id: (await context.params).noteId },
      data: { gmOnly },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error updating note visibility:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
