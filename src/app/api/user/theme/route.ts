import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { theme: true },
  });
  return NextResponse.json({ theme: user?.theme || 'system' });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const { theme } = await req.json();
  if (!theme || !['light', 'dark', 'system'].includes(theme)) {
    return new NextResponse('Invalid theme', { status: 400 });
  }
  await prisma.user.update({
    where: { id: session.user.id },
    data: { theme },
  });
  return NextResponse.json({ theme });
}
