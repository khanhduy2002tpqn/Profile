import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await verifyAuth(req);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const seasons = await prisma.season.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { year: 'desc' },
    });
    return NextResponse.json(seasons);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await verifyAuth(req);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { seasonCode, name, year, isActive } = await req.json();

    if (!seasonCode || !name || !year) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const code = seasonCode.trim().toUpperCase();

    // Check unique seasonCode for organization
    const existing = await prisma.season.findUnique({
      where: {
        organizationId_seasonCode: {
          organizationId: user.organizationId,
          seasonCode: code,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ message: `Season code ${code} already exists` }, { status: 400 });
    }

    if (isActive) {
      // Set all other seasons as inactive
      await prisma.season.updateMany({
        where: { organizationId: user.organizationId, isActive: true },
        data: { isActive: false },
      });
    }

    const newSeason = await prisma.season.create({
      data: {
        seasonCode: code,
        name: name.trim(),
        year: Number(year),
        isActive: isActive ?? false,
        organizationId: user.organizationId,
      },
    });

    return NextResponse.json(newSeason, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
  }
}
