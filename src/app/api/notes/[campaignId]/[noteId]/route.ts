import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

// GET /api/notes/[campaignId]/[noteId] - Get a specific note
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
            id: true,
            name: true,
            email: true,
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

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PATCH /api/notes/[campaignId]/[noteId] - Update a note
export async function PATCH(req: Request, context: any) {
  const session = await getServerSession(authOptions);
  const { campaignId, noteId } = (await context.params);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { content, title, gmOnly } = await req.json();

    if (!content) {
      return new NextResponse('Content is required', { status: 400 });
    }

    if (!title) {
      return new NextResponse('Title is required', { status: 400 });
    }

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

    // Only GMs can update GM-only notes
    if (gmOnly && member.role !== 'GM') {
      return new NextResponse('Only GMs can update GM-only notes', { status: 403 });
    }

    const note = await prisma.note.update({
      where: { id: noteId },
      data: {
        content,
        title,
        gmOnly: gmOnly || false,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE /api/notes/[campaignId]/[noteId] - Delete a note
export async function DELETE(req: Request, context: any) {
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
    });

    if (!note) {
      return new NextResponse('Note not found', { status: 404 });
    }

    // Only allow note deletion by the creator or GM
    if (note.createdById !== session.user.id && member.role !== 'GM') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await prisma.note.delete({
      where: { id: noteId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting note:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
