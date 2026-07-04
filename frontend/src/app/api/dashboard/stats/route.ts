import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await verifyAuth(req);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const seasonId = searchParams.get('seasonId');

  if (!seasonId) {
    return NextResponse.json({ message: 'seasonId query parameter is required' }, { status: 400 });
  }

  try {
    // Verify season belongs to user's organization
    const season = await prisma.season.findFirst({
      where: { id: seasonId, organizationId: user.organizationId },
    });

    if (!season) {
      return NextResponse.json({ message: 'Season not found' }, { status: 404 });
    }

    const [students, photos, projects, awards, certificates] = await Promise.all([
      prisma.student.count({ where: { seasonId } }),
      prisma.activity.count({
        where: { student: { seasonId } },
      }),
      prisma.project.count({
        where: { student: { seasonId } },
      }),
      prisma.award.count({
        where: { student: { seasonId } },
      }),
      prisma.certificate.count({
        where: { student: { seasonId } },
      }),
    ]);

    return NextResponse.json({
      students,
      photos,
      projects,
      awards,
      certificates,
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
  }
}
