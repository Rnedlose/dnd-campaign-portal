import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

// GET /api/campaigns/[campaignId] - Get campaign details
export async function GET(req: Request, context: any) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Get campaign and user's role in it
    const campaignMember = await prisma.campaignMember.findUnique({
      where: {
        campaignId_userId: {
          campaignId: (await context.params).campaignId,
          userId: session.user.id,
        },
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!campaignMember) {
      return new NextResponse('Not found', { status: 404 });
    }

    return NextResponse.json({
      ...campaignMember.campaign,
      role: campaignMember.role,
    });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PATCH /api/campaigns/[campaignId] - Update campaign details
export async function PATCH(req: Request, context: any) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { name, description } = await req.json();

    // Check if user is GM of the campaign
    const campaignMember = await prisma.campaignMember.findUnique({
      where: {
        campaignId_userId: {
          campaignId: (await context.params).campaignId,
          userId: session.user.id,
        },
      },
    });

    if (!campaignMember || campaignMember.role !== 'GM') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const campaign = await prisma.campaign.update({
      where: { id: (await context.params).campaignId },
      data: { name, description },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE /api/campaigns/[campaignId] - Delete campaign
export async function DELETE(req: Request, context: any) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Check if user is GM of the campaign
    const campaignMember = await prisma.campaignMember.findUnique({
      where: {
        campaignId_userId: {
          campaignId: (await context.params).campaignId,
          userId: session.user.id,
        },
      },
    });

    if (!campaignMember || campaignMember.role !== 'GM') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await prisma.campaign.delete({
      where: { id: (await context.params).campaignId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
