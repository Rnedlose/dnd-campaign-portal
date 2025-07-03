import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return new NextResponse('No file uploaded', { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}-${file.name}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filepath = join(uploadDir, filename);

    // Save the file
    await writeFile(filepath, buffer);

    // Update user's profile image
    const imageUrl = `/uploads/${filename}`;
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl },
    });

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('[IMAGE_UPLOAD]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
