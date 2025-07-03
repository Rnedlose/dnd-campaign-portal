import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

// GET /api/campaigns - Get user's campaigns
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Get campaigns created by the user
    const createdCampaigns = await prisma.campaign.findMany({
      where: {
        createdById: session.user.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    // Get campaigns the user has joined (excluding those they created)
    const joinedCampaigns = await prisma.campaignMember.findMany({
      where: {
        userId: session.user.id,
        campaign: {
          createdById: {
            not: session.user.id,
          },
        },
      },
      select: {
        campaign: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        role: true,
      },
    });

    return NextResponse.json({
      createdCampaigns,
      joinedCampaigns: joinedCampaigns.map((member: { campaign: { id: string; name: string; description: string | null; }; role: string; }) => ({
        ...member.campaign,
        role: member.role,
      })),
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST /api/campaigns - Create a new campaign
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { name, description } = await req.json();

    if (!name) {
      return new NextResponse('Name is required', { status: 400 });
    }

    // Create the campaign and add the creator as GM
    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        createdById: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: 'GM',
          },
        },
      },
      include: {
        members: {
          where: {
            userId: session.user.id,
          },
          select: {
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      role: campaign.members[0].role,
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
