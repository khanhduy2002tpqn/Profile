import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import * as QRCode from 'qrcode';
import { Readable, PassThrough } from 'stream';

// Use require statement to bypass TS call signature errors for archiver
// eslint-disable-next-line @typescript-eslint/no-var-requires
const archiver = require('archiver');

export async function GET(req: Request) {
  const user = await verifyAuth(req);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const seasonId = searchParams.get('seasonId');

  if (!seasonId) {
    return new Response('seasonId query parameter is required', { status: 400 });
  }

  try {
    // Verify season belongs to user's organization
    const season = await prisma.season.findFirst({
      where: { id: seasonId, organizationId: user.organizationId },
    });

    if (!season) {
      return new Response('Season not found', { status: 404 });
    }

    const students = await prisma.student.findMany({
      where: { seasonId },
      select: { campId: true, publicId: true },
    });

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    const passthrough = new PassThrough();
    archive.pipe(passthrough);

    // Run async compression
    (async () => {
      try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        for (const student of students) {
          const portfolioUrl = `${frontendUrl}/p/${student.publicId}`;
          const qrBuffer = await QRCode.toBuffer(portfolioUrl, {
            type: 'png',
            width: 512,
            margin: 2,
          });

          archive.append(qrBuffer, { name: `${student.campId}_qr.png` });
        }
        await archive.finalize();
      } catch (err) {
        console.error('ZIP generation error:', err);
        passthrough.destroy(err as any);
      }
    })();

    // Stream response
    return new Response(passthrough as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename=qr_codes_${seasonId}.zip`,
      },
    });
  } catch (err: any) {
    return new Response(err.message || 'Server error', { status: 500 });
  }
}
