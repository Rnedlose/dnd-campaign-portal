import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { prisma } from '@/lib/prisma';

// GET /api/notes/[campaignId] - Get campaign notes
export async function GET(req: Request, context: any) {
  const session = await getServerSession(authOptions);
  const campaignId = (await context.params).campaignId;

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const member = await prisma.campaignMember.findFirst({
      where: {
        campaignId,
        userId: session.user.id,
      },
    });

    if (!member) {
      return new NextResponse('Not found', { status: 404 });
    }

    const notes = await prisma.note.findMany({
      where: {
        campaignId,
        OR: [
          { gmOnly: false },
          {
            gmOnly: true,
            campaign: { members: { some: { userId: session.user.id, role: 'GM' } } },
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST /api/notes/[campaignId] - Create a new note
export async function POST(req: Request, context: any) {
  const session = await getServerSession(authOptions);
  const campaignId = (await context.params).campaignId;

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { content, gmOnly = false, title } = await req.json();

    if (!content) {
      return new NextResponse('Content is required', { status: 400 });
    }

    const member = await prisma.campaignMember.findFirst({
      where: {
        campaignId,
        userId: session.user.id,
      },
      include: {
        campaign: true,
      },
    });

    if (!member) {
      return new NextResponse('Not found', { status: 404 });
    }

    // Only GMs can create GM-only notes
    if (gmOnly && member.role !== 'GM') {
      return new NextResponse('Only GMs can create GM-only notes', { status: 403 });
    }

    const note = await prisma.note.create({
      data: {
        title: title || `Note by ${session.user.id} at ${new Date().toLocaleString()}`,
        content,
        gmOnly,
        campaignId,
        createdById: session.user.id,
        tags: [],
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
    console.error('Error creating note:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PUT /api/notes/[campaignId] - Update campaign notes
export async function PUT(req: Request, context: any) {
  const session = await getServerSession(authOptions);
  const campaignId = (await context.params).campaignId;

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { id, content, gmOnly = false, title } = await req.json();

    if (!content) {
      return new NextResponse('Content is required', { status: 400 });
    }

    const member = await prisma.campaignMember.findFirst({
      where: {
        campaignId,
        userId: session.user.id,
      },
    });

    if (!member) {
      return new NextResponse('Not found', { status: 404 });
    }

    // Only GMs can create/update GM-only notes
    if (gmOnly && member.role !== 'GM') {
      return new NextResponse('Only GMs can create/update GM-only notes', { status: 403 });
    }

    const note = await prisma.note.upsert({
      where: {
        id: id || 'new',
      },
      create: {
        title: title || `Note by ${session.user.id} at ${new Date().toLocaleString()}`,
        content,
        gmOnly,
        campaignId,
        createdById: session.user.id,
        tags: [],
      },
      update: {
        content,
        gmOnly,
        updatedAt: new Date(),
        ...(title ? { title } : {}),
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
