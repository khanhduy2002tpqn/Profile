import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { uploadImage } from '@/lib/storage';
import * as QRCode from 'qrcode';

function generateRandomId(length = 9): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function getUniquePublicId(): Promise<string> {
  while (true) {
    const publicId = generateRandomId(9);
    const existing = await prisma.student.findUnique({
      where: { publicId },
    });
    if (!existing) return publicId;
  }
}

async function generateStudentQRCode(publicId: string): Promise<string> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const portfolioUrl = `${frontendUrl}/p/${publicId}`;

  const qrBuffer = await QRCode.toBuffer(portfolioUrl, {
    type: 'png',
    width: 512,
    margin: 2,
  });

  return uploadImage(qrBuffer, `qr_${publicId}.png`, 'image/png');
}

export async function GET(req: Request) {
  const user = await verifyAuth(req);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const seasonId = searchParams.get('seasonId');
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  if (!seasonId) {
    return NextResponse.json({ message: 'seasonId query parameter is required' }, { status: 400 });
  }

  const skip = (page - 1) * limit;

  const where: any = { seasonId };
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { campId: { contains: search, mode: 'insensitive' } },
      { hometown: { contains: search, mode: 'insensitive' } },
    ];
  }

  try {
    const [items, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { campId: 'asc' },
        include: {
          projects: true,
          awards: true,
          activities: true,
          certificates: true,
        },
      }),
      prisma.student.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
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
    const { campId, fullName, age, hometown } = await req.json();

    if (!campId || !fullName) {
      return NextResponse.json({ message: 'CampID and FullName are required' }, { status: 400 });
    }

    const cleanCampId = campId.trim().toUpperCase();

    // Check unique campId in season
    const existing = await prisma.student.findUnique({
      where: {
        seasonId_campId: {
          seasonId,
          campId: cleanCampId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ message: `CampID ${cleanCampId} already exists in this season` }, { status: 400 });
    }

    const publicId = await getUniquePublicId();
    const qrCodeUrl = await generateStudentQRCode(publicId);

    const student = await prisma.student.create({
      data: {
        campId: cleanCampId,
        fullName: fullName.trim(),
        age: Number(age) || 10,
        hometown: hometown?.trim() || 'Unknown',
        publicId,
        qrCodeUrl,
        seasonId,
      },
    });

    return NextResponse.json(student, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
  }
}
