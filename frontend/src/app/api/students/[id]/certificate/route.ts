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

    // Delete existing certificate if any
    await prisma.certificate.deleteMany({
      where: { studentId: id },
    });

    const cert = await prisma.certificate.create({
      data: {
        studentId: id,
        imageUrl,
      },
    });

    return NextResponse.json(cert, { status: 201 });
  } catch (err: any) {
    console.error('Certificate upload error:', err);
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
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

    await prisma.certificate.deleteMany({
      where: { studentId: id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
  }
}
