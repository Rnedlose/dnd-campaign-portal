import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, context: any) {
  const session = await getServerSession(authOptions);
  const campaignId = (await context.params).campaignId;

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const membership = await prisma.campaignMember.findUnique({
      where: {
        campaignId_userId: {
          campaignId,
          userId: session.user.id,
        },
      },
      select: {
        role: true,
      },
    });

    if (!membership) {
      return new NextResponse('Not a member of this campaign', { status: 403 });
    }

    return NextResponse.json({ role: membership.role });
  } catch (error) {
    console.error('Error fetching campaign role:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
