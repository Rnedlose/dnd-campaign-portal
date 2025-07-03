import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { campaignId, name, url, type, size, gmOnly } = await req.json();

    if (!campaignId || !name || !url) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Check for duplicate file name in this campaign
    const existing = await prisma.file.findFirst({
      where: {
        campaignId,
        name,
      },
    });
    if (existing) {
      return new NextResponse('A file with this name already exists in this campaign.', { status: 409 });
    }

    // Verify user has access to the campaign
    const campaignMember = await prisma.campaignMember.findUnique({
      where: {
        campaignId_userId: {
          campaignId,
          userId: session.user.id,
        },
      },
    });

    if (!campaignMember) {
      return new NextResponse('Not a member of this campaign', { status: 403 });
    }

    // Create file record
    const file = await prisma.file.create({
      data: {
        name,
        url,
        type: type || 'application/pdf', // Use provided type or default to PDF
        size: size || 0, // Use provided size or default to 0
        gmOnly: gmOnly ?? false,
        campaignId,
        uploadedById: session.user.id,
      },
    });

    return NextResponse.json(file);
  } catch (error) {
    console.error('Error creating file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
