import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, context: any) {
  const session = await getServerSession(authOptions);
  const { campaignId } = (await context.params);
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (!query) {
    return new NextResponse("Query parameter 'q' is required", { status: 400 });
  }

  try {
    const notes = await prisma.note.findMany({
      where: {
        campaignId,
        AND: [
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { content: { contains: query, mode: 'insensitive' } },
            ],
          },
          {
            OR: [
              { gmOnly: false },
              {
                gmOnly: true,
                campaign: { members: { some: { userId: session.user.id, role: 'GM' } } },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        content: true,
      },
      take: 10,
    });

    // Format the search results with previews
    const results = notes.map((note: { id: string; title: string; content: string; }) => ({
      id: note.id,
      title: note.title,
      preview: note.content.slice(0, 100) + (note.content.length > 100 ? '...' : ''),
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching notes:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
