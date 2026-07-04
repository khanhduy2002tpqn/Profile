import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { uploadImage } from '@/lib/storage';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, context: RouteContext) {
  const user = await verifyAuth(req);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: { season: true },
    });

    if (!student || student.season.organizationId !== user.organizationId) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || '';
    const icon = formData.get('icon') as string || 'trophy';
    const file = formData.get('file') as File | null;

    if (!title) {
      return NextResponse.json({ message: 'Award title is required' }, { status: 400 });
    }

    let imageUrl = '';
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      imageUrl = await uploadImage(buffer, file.name, file.type);
    }

    const award = await prisma.award.create({
      data: {
        studentId: id,
        title: title.trim(),
        description: description.trim(),
        icon: icon.trim(),
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json(award, { status: 201 });
  } catch (err: any) {
    console.error('Award creation error:', err);
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
  }
}
