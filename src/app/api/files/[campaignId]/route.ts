import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { unlink } from 'fs/promises';
import { join } from 'path';

// DELETE /api/files/[campaignId] - Delete a file
export async function DELETE(req: Request, context: any) {
  const session = await getServerSession(authOptions);
  const campaignId = (await context.params).campaignId;

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const file = await prisma.file.findFirst({
      where: { campaignId },
    });

    if (!file) {
      return new NextResponse('File not found', { status: 404 });
    }

    // Check if user is GM of the campaign
    const campaignMember = await prisma.campaignMember.findUnique({
      where: {
        campaignId_userId: {
          campaignId: file.campaignId,
          userId: session.user.id,
        },
      },
    });

    if (!campaignMember || campaignMember.role !== 'GM') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Delete file from filesystem
    const filePath = join(process.cwd(), 'public', file.url);
    await unlink(filePath);

    // Delete file record from database
    await prisma.file.delete({
      where: { id: file.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// GET /api/files/[campaignId] - List all files for a campaign
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

    // Get all files for the campaign
    const files = await prisma.file.findMany({
      where: {
        campaignId,
        // If user is not GM, only show non-GM-only files
        ...(campaignMember.role !== 'GM' ? { gmOnly: false } : {}),
      },
      orderBy: {
        uploadedAt: 'desc',
      },
      include: {
        uploadedBy: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
