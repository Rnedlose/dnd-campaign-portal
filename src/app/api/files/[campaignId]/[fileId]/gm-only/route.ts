import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

export async function PATCH(req: Request, context: any) {
  const { campaignId, fileId } = (await context.params);
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return new NextResponse('File not found', { status: 404 });
    }

    // Check if user is GM of the campaign
    const campaignMember = await prisma.campaignMember.findUnique({
      where: {
        campaignId_userId: {
          campaignId,
          userId: session.user.id,
        },
      },
    });

    if (!campaignMember || campaignMember.role !== 'GM') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { gmOnly } = await req.json();

    if (typeof gmOnly !== 'boolean') {
      return new NextResponse('gmOnly must be a boolean', { status: 400 });
    }

    // Update file record in database
    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: { gmOnly },
    });

    return NextResponse.json(updatedFile);
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
