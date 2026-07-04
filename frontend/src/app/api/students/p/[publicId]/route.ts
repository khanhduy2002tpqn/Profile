import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ publicId: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  const { publicId } = await context.params;

  try {
    const student = await prisma.student.findUnique({
      where: { publicId },
      include: {
        projects: { orderBy: { order: 'asc' } },
        awards: true,
        activities: { orderBy: { order: 'asc' } },
        certificates: true,
        season: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ message: 'Portfolio not found' }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
  }
}
