import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug: 'summer-camp' },
    });

    if (!org) {
      return NextResponse.json({ message: 'Default organization not found' }, { status: 404 });
    }

    const activeSeason = await prisma.season.findFirst({
      where: { organizationId: org.id, isActive: true },
    });

    return NextResponse.json(activeSeason);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
  }
}
