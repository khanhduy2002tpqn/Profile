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
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const imageUrl = await uploadImage(buffer, file.name, file.type);

    const maxOrder = await prisma.activity.aggregate({
      where: { studentId: id },
      _max: { order: true },
    });
    const order = (maxOrder._max.order ?? -1) + 1;

    const activity = await prisma.activity.create({
      data: {
        studentId: id,
        imageUrl,
        order,
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (err: any) {
    console.error('Activity upload error:', err);
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
  }
}
