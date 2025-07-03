import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(req: Request, context: any) {
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

    // Check if this is an old-style file (stored locally)
    if (file.url.startsWith('/')) {
      // Delete file from filesystem
      const filePath = join(process.cwd(), 'public', file.url);
      await unlink(filePath).catch(() => {}); // Ignore if file doesn't exist
    } else {
      // This is an Uploadthing file
      const fileKey = file.url.split('/').pop();
      const apiKey = process.env.UPLOADTHING_SECRET;

      if (!apiKey) {
        console.error('Uploadthing API key is not configured. Please check your .env.local file.');
        console.error(
          'Expected format: UPLOADTHING_SECRET=sk_live_... or UPLOADTHING_SECRET=sk_test_...',
        );
        return new NextResponse('Server configuration error: Uploadthing API key missing', {
          status: 500,
        });
      }

      if (!fileKey) {
        console.error('Could not extract file key from URL:', file.url);
        return new NextResponse('Invalid file URL format', { status: 400 });
      }

      // Delete file from Uploadthing using their API
      const response = await fetch(`https://uploadthing.com/api/deleteFile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-uploadthing-api-key': apiKey,
        },
        body: JSON.stringify({
          fileKeys: [fileKey],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to delete file from Uploadthing:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          fileKey,
          url: file.url,
          apiKey: apiKey.substring(0, 10) + '...', // Log first 10 chars of API key for debugging
        });
        // Continue with database deletion even if Uploadthing deletion fails
      } else {
        console.log('Successfully deleted file from Uploadthing:', fileKey);
      }
    }

    // Remove file from database
    const deletedFile = await prisma.file.delete({
      where: { id: fileId },
    });

    return NextResponse.json(deletedFile);
  } catch (error) {
    console.error('Error deleting file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
