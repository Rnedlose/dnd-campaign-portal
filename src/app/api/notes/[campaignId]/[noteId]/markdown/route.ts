import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

// GET /api/notes/[campaignId]/[noteId]/markdown - Get note as markdown file
export async function GET(req: Request, context: any) {
  const session = await getServerSession(authOptions);
  const { campaignId, noteId } = (await context.params);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Check if user is a member of the campaign
    const member = await prisma.campaignMember.findUnique({
      where: {
        campaignId_userId: {
          campaignId,
          userId: session.user.id,
        },
      },
    });

    if (!member) {
      return new NextResponse('Not found', { status: 404 });
    }

    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!note) {
      return new NextResponse('Note not found', { status: 404 });
    }

    // Only show GM-only notes to GMs
    if (note.gmOnly && member.role !== 'GM') {
      return new NextResponse('Not found', { status: 404 });
    }

    // Create markdown content with metadata
    const metadata = [
      `# ${note.title}`,
      ``,
      `> Created by: ${note.createdBy.name}`,
      `> Last updated: ${note.updatedAt.toLocaleString()}`,
      `${note.gmOnly ? '> GM Only Note' : ''}`,
      ``,
      '---',
      ``,
      note.content,
    ].join('\n');

    // Return as downloadable markdown file
    return new NextResponse(metadata, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `inline; filename="${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md"`,
      },
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
