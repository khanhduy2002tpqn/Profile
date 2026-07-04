import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  const user = await verifyAuth(req);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        projects: { orderBy: { order: 'asc' } },
        awards: true,
        activities: { orderBy: { order: 'asc' } },
        certificates: true,
        season: true,
      },
    });

    if (!student || student.season.organizationId !== user.organizationId) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: Request, context: RouteContext) {
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

    const { fullName, age, hometown, avatarUrl } = await req.json();
    const data: any = {};

    if (fullName !== undefined) data.fullName = fullName.trim();
    if (age !== undefined) data.age = Number(age);
    if (hometown !== undefined) data.hometown = hometown.trim();
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;

    const updated = await prisma.student.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
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

    await prisma.student.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
  }
}
