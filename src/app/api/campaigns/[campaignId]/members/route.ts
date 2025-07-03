import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

// GET /api/campaigns/[campaignId]/members - Get campaign members
export async function GET(request: Request, context: any) {
  const { params } = context;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const member = await prisma.campaignMember.findUnique({
      where: {
        campaignId_userId: {
          campaignId: params.campaignId,
          userId: session.user.id,
        },
      },
    });

    if (!member) {
      return new NextResponse('Not found', { status: 404 });
    }

    const members = await prisma.campaignMember.findMany({
      where: { campaignId: params.campaignId },
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

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST /api/campaigns/[campaignId]/members - Add a new member to the campaign
export async function POST(req: Request, context: any) {
  const { params } = context;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Check if the current user is a GM of the campaign
    const campaignMember = await prisma.campaignMember.findUnique({
      where: {
        campaignId_userId: {
          campaignId: params.campaignId,
          userId: session.user.id,
        },
      },
    });

    if (!campaignMember || campaignMember.role !== 'GM') {
      return new NextResponse('Unauthorized - Only GMs can add members', { status: 401 });
    }

    const { email } = await req.json();

    if (!email) {
      return new NextResponse('Email is required', { status: 400 });
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Check if user is already a member
    const existingMember = await prisma.campaignMember.findUnique({
      where: {
        campaignId_userId: {
          campaignId: params.campaignId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      return new NextResponse('User is already a member of this campaign', { status: 400 });
    }

    // Add the user as a member with PLAYER role
    const newMember = await prisma.campaignMember.create({
      data: {
        campaignId: params.campaignId,
        userId: user.id,
        role: 'PLAYER',
      },
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

    return NextResponse.json(newMember);
  } catch (error) {
    console.error('Error adding campaign member:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
