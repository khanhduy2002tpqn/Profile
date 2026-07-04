import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { uploadImage, uploadFile } from '@/lib/storage';

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
    const videoUrl = formData.get('videoUrl') as string || '';
    
    const cover = formData.get('cover') as File | null;
    const ppt = formData.get('ppt') as File | null;
    const pdf = formData.get('pdf') as File | null;

    if (!title) {
      return NextResponse.json({ message: 'Project title is required' }, { status: 400 });
    }

    let coverUrl = '';
    let pptUrl = '';
    let pdfUrl = '';

    if (cover) {
      const buffer = Buffer.from(await cover.arrayBuffer());
      coverUrl = await uploadImage(buffer, cover.name, cover.type);
    }

    if (ppt) {
      const buffer = Buffer.from(await ppt.arrayBuffer());
      pptUrl = await uploadFile(buffer, ppt.name, ppt.type);
    }

    if (pdf) {
      const buffer = Buffer.from(await pdf.arrayBuffer());
      pdfUrl = await uploadFile(buffer, pdf.name, pdf.type);
    }

    const maxOrder = await prisma.project.aggregate({
      where: { studentId: id },
      _max: { order: true },
    });
    const order = (maxOrder._max.order ?? -1) + 1;

    const project = await prisma.project.create({
      data: {
        studentId: id,
        title: title.trim(),
        description: description.trim(),
        videoUrl: videoUrl.trim(),
        coverUrl: coverUrl || null,
        pptUrl: pptUrl || null,
        pdfUrl: pdfUrl || null,
        order,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (err: any) {
    console.error('Project creation error:', err);
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
  }
}
