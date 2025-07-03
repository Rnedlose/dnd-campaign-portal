import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

// PATCH /api/campaigns/[campaignId]/members/[memberId] - Update member role
export async function PATCH(req: Request, context: any) {
  const { params } = context;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { role } = await req.json();

    // Check if user is GM of the campaign
    const campaignMember = await prisma.campaignMember.findUnique({
      where: {
        campaignId_userId: {
          campaignId: params.campaignId,
          userId: session.user.id,
        },
      },
    });

    if (!campaignMember || campaignMember.role !== 'GM') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const updatedMember = await prisma.campaignMember.update({
      where: {
        id: params.memberId,
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error updating member:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE /api/campaigns/[campaignId]/members/[memberId] - Remove member
export async function DELETE(req: Request, context: any) {
  const { params } = context;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Check if user is GM of the campaign
    const campaignMember = await prisma.campaignMember.findUnique({
      where: {
        campaignId_userId: {
          campaignId: params.campaignId,
          userId: session.user.id,
        },
      },
    });

    if (!campaignMember || campaignMember.role !== 'GM') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await prisma.campaignMember.delete({
      where: {
        id: params.memberId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting member:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
