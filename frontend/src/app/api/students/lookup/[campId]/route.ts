import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ campId: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  const { campId } = await context.params;

  try {
    const student = await prisma.student.findFirst({
      where: { campId: { equals: campId.trim(), mode: 'insensitive' } },
      select: { publicId: true },
    });

    if (!student) {
      return NextResponse.json({ message: 'CampID not found' }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
  }
}
