import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function PATCH(request: Request, context: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { name } = await request.json();

    // Verify user is GM of the campaign
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

    // Update the name in the database
    const file = await prisma.file.update({
      where: {
        id: (await context.params).fileId,
      },
      data: {
        name: name,
      },
    });

    return NextResponse.json(file);
  } catch (error) {
    console.error('Error renaming file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
