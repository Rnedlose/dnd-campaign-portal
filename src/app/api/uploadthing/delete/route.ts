import { NextResponse } from 'next/server';
import { UTApi } from 'uploadthing/server';

const utapi = new UTApi();

export async function POST(req: Request) {
  const { url } = await req.json();

  // Extract the file key from the URL (UploadThing URLs are like https://utfs.io/f/{fileKey})
  const match = url.match(/\/f\/([^/?]+)/);
  const fileKey = match ? match[1] : null;

  if (!fileKey) {
    return NextResponse.json({ success: false, error: 'Invalid file URL' }, { status: 400 });
  }

  try {
    await utapi.deleteFiles([fileKey]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete file from UploadThing:', err);
    return NextResponse.json({ success: false, error: 'Failed to delete file' }, { status: 500 });
  }
} 