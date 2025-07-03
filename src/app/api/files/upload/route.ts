import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// POST /api/files/upload - Upload a file
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const campaignId = formData.get('campaignId') as string;

    if (!file || !campaignId) {
      return new NextResponse('Missing file or campaignId', { status: 400 });
    }

    // Enforce 100MB max file size
    if (file.size > 100 * 1024 * 1024) {
      return new NextResponse('File size exceeds 100MB limit.', { status: 400 });
    }

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
      return new NextResponse('Not a member of this campaign', { status: 403 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', campaignId);
    await mkdir(uploadDir, { recursive: true });

    // Save file
    const filePath = join(uploadDir, file.name);
    await writeFile(filePath, buffer);

    // Create file record in database
    const fileRecord = await prisma.file.create({
      data: {
        name: file.name,
        type: file.type,
        size: file.size,
        url: `/uploads/${campaignId}/${file.name}`,
        campaignId,
        uploadedById: session.user.id,
      },
    });

    return NextResponse.json(fileRecord);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
