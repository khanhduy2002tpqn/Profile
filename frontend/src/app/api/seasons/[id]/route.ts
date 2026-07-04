import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, context: RouteContext) {
  const user = await verifyAuth(req);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const existing = await prisma.season.findFirst({
      where: { id, organizationId: user.organizationId },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Season not found' }, { status: 404 });
    }

    const { name, year, isActive } = await req.json();
    const data: any = {};

    if (name !== undefined) data.name = name.trim();
    if (year !== undefined) data.year = Number(year);
    
    if (isActive !== undefined) {
      data.isActive = isActive;
      if (isActive && !existing.isActive) {
        // Set all other seasons as inactive
        await prisma.season.updateMany({
          where: { organizationId: user.organizationId, isActive: true },
          data: { isActive: false },
        });
      }
    }

    const updated = await prisma.season.update({
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
    const existing = await prisma.season.findFirst({
      where: { id, organizationId: user.organizationId },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Season not found' }, { status: 404 });
    }

    if (existing.isActive) {
      return NextResponse.json({ message: 'Cannot delete the active season' }, { status: 400 });
    }

    await prisma.season.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
  }
}
