import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

type RouteContext = {
  params: Promise<{ campaignId: string }>;
};

// GET /api/chat/[campaignId] - Get chat messages
export async function GET(req: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const { campaignId } = await context.params;

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Check if user is a member of the campaign
    const member = await prisma.campaignMember.findUnique({
      where: {
        campaignId_userId: {
          campaignId: campaignId,
          userId: session.user.id,
        },
      },
    });

    if (!member) {
      return new NextResponse('Not found', { status: 404 });
    }

    // Get chat messages
    const messages = await prisma.chat.findMany({
      where: {
        campaignId: campaignId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(
      messages.map((msg) => ({
        ...msg,
        content: msg.message,
      }))
    );
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST /api/chat/[campaignId] - Send a chat message
export async function POST(req: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const { campaignId } = await context.params;

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { content } = await req.json();

    // Check if user is a member of the campaign
    const campaignMember = await prisma.campaignMember.findUnique({
      where: {
        campaignId_userId: {
          campaignId: campaignId,
          userId: session.user.id,
        },
      },
    });

    if (!campaignMember) {
      return new NextResponse('Not a member of this campaign', { status: 403 });
    }

    const message = await prisma.chat.create({
      data: {
        message: content,
        campaignId: campaignId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...message,
      content: message.message,
    });
  } catch (error) {
    console.error('Error creating chat message:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
