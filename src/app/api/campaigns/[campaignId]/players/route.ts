import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

export async function GET(request: Request, context: any) {
  const session = await getServerSession(authOptions);
  const campaignId = (await context.params).campaignId;

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Check if user is a member of the campaign
    const campaignMember = await prisma.campaignMember.findUnique({
      where: {
        campaignId_userId: {
          campaignId,
          userId: session.user.id,
        },
      },
    });

    if (!campaignMember) {
      return new NextResponse('Not found', { status: 404 });
    }

    // Get all members of the campaign
    const members = await prisma.campaignMember.findMany({
      where: {
        campaignId,
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

    // Transform the data to match the expected format
    const players = members.map((member: { user: { id: string; name: string | null; email: string | null; image: string | null; }; role: string; }) => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      image: member.user.image,
      role: member.role,
    }));

    return NextResponse.json(players);
  } catch (error) {
    console.error('Error fetching campaign players:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
