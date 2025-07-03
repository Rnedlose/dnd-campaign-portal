import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

type RouteContext = {
  params: Promise<{ campaignId: string }>;
};

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  const session = await getServerSession(authOptions);
  const { campaignId } = await context.params;

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Check if user is GM
  const member = await prisma.campaignMember.findUnique({
    where: {
      campaignId_userId: {
        campaignId: campaignId,
        userId: session.user.id,
      },
    },
  });
  if (!member || member.role !== 'GM') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    await prisma.chat.deleteMany({ where: { campaignId } });
    return new NextResponse('Chat cleared', { status: 200 });
  } catch (error) {
    console.error('Error clearing chat:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 