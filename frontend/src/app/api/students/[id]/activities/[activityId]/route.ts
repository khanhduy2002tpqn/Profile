import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string; activityId: string }>;
}

export async function DELETE(req: Request, context: RouteContext) {
  const user = await verifyAuth(req);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id, activityId } = await context.params;

  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: { season: true },
    });

    if (!student || student.season.organizationId !== user.organizationId) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    const activity = await prisma.activity.findFirst({
      where: { id: activityId, studentId: id },
    });

    if (!activity) {
      return NextResponse.json({ message: 'Activity photo not found' }, { status: 404 });
    }

    await prisma.activity.delete({
      where: { id: activityId },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
  }
}
