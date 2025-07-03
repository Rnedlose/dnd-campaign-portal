import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, context: any) {
  const session = await getServerSession(authOptions);
  const { campaignId, fileId } = (await context.params);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const file = await prisma.file.findUnique({
      where: {
        id: fileId,
        campaignId,
      },
      include: {
        campaign: {
          include: {
            members: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
      },
    });

    if (!file) {
      return new NextResponse('File not found', { status: 404 });
    }

    // Check if user is a member of the campaign
    if (file.campaign.members.length === 0) {
      return new NextResponse('Not a member of this campaign', { status: 403 });
    }

    // Check if file is GM-only and user is not GM
    if (file.gmOnly && file.campaign.members[0].role !== 'GM') {
      return new NextResponse('File is GM-only', { status: 403 });
    }

    // Return the file URL
    return NextResponse.json({ url: file.url });
  } catch (error) {
    console.error('Error downloading file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
