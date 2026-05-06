import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const filename = formData.get('filename') as string;
  const contentType = formData.get('contentType') as string;

  if (!file || !filename) {
    return NextResponse.json({ error: 'Missing file or filename' }, { status: 400 });
  }

  const blob = await put(filename, file, {
    contentType: contentType || file.type,
    access: 'public',
  });

  return NextResponse.json({ url: blob.url, pathname: blob.pathname });
}
