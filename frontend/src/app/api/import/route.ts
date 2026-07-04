import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { uploadImage, uploadFile } from '@/lib/storage';
import * as XLSX from 'xlsx';
import * as QRCode from 'qrcode';
import * as path from 'path';

// Use require statement to bypass TS call signature errors for adm-zip
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AdmZip = require('adm-zip');

interface ImportLog {
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

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

  const logs: ImportLog[] = [];
  logs.push({ type: 'info', message: 'Starting bulk import process...' });

  try {
    // 1. Verify Season belongs to user's organization
    const season = await prisma.season.findFirst({
      where: { id: seasonId, organizationId: user.organizationId },
    });
    if (!season) {
      return NextResponse.json({ message: 'Season not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const metadataFile = formData.get('metadata') as File | null;
    const zipFile = formData.get('zip') as File | null;

    if (!metadataFile) {
      return NextResponse.json({ message: 'Metadata file is required (form-data: metadata)' }, { status: 400 });
    }

    // 2. Parse Excel/CSV
    let rawData: any[] = [];
    try {
      const metadataBuffer = Buffer.from(await metadataFile.arrayBuffer());
      const workbook = XLSX.read(metadataBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      rawData = XLSX.utils.sheet_to_json<any>(worksheet);
      logs.push({ type: 'info', message: `Parsed ${rawData.length} rows from metadata file.` });
    } catch (err) {
      console.error('Error parsing metadata file', err);
      logs.push({ type: 'error', message: 'Failed to parse metadata file. Must be valid Excel/CSV.' });
      return NextResponse.json({ success: false, logs });
    }

    if (rawData.length === 0) {
      logs.push({ type: 'error', message: 'Metadata file is empty.' });
      return NextResponse.json({ success: false, logs });
    }

    // 3. Map Zip entries if present
    const assetsMap: { [filename: string]: { buffer: Buffer; originalname: string; ext: string } } = {};
    if (zipFile) {
      try {
        const zipBuffer = Buffer.from(await zipFile.arrayBuffer());
        const zip = new AdmZip(zipBuffer);
        const zipEntries = zip.getEntries();
        let fileCount = 0;

        for (const entry of zipEntries) {
          if (entry.isDirectory || entry.entryName.includes('__MACOSX') || path.basename(entry.entryName).startsWith('.')) {
            continue;
          }
          const basename = path.basename(entry.entryName);
          const ext = path.extname(basename).toLowerCase();
          assetsMap[basename.toLowerCase()] = {
            buffer: entry.getData(),
            originalname: basename,
            ext,
          };
          fileCount++;
        }
        logs.push({ type: 'info', message: `Indexed ${fileCount} files from ZIP archive.` });
      } catch (err) {
        console.error('Error extracting ZIP file', err);
        logs.push({ type: 'warning', message: 'Failed to extract ZIP archive. Proceeding with metadata only.' });
      }
    }

    // 4. Process each student row
    let successCount = 0;
    for (let index = 0; index < rawData.length; index++) {
      const row = rawData[index];
      const rowNum = index + 2; // Excel header is row 1

      // Read values, normalizing column case
      const campId = (row.CampID || row.campId || row.campid || '').toString().trim();
      const fullName = (row.FullName || row.fullName || row.fullname || row.Name || row.name || '').toString().trim();
      const ageRaw = row.Age || row.age || 10;
      const hometown = (row.Hometown || row.hometown || row.home_town || 'Unknown').toString().trim();

      if (!campId || !fullName) {
        logs.push({
          type: 'error',
          message: `Row ${rowNum}: Missing CampID or FullName. Skipped.`,
        });
        continue;
      }

      const age = parseInt(ageRaw, 10) || 10;

      try {
        // Upsert student in this season
        let student = await prisma.student.findFirst({
          where: { seasonId, campId: { equals: campId, mode: 'insensitive' } },
        });

        if (student) {
          student = await prisma.student.update({
            where: { id: student.id },
            data: { fullName, age, hometown },
          });
          logs.push({ type: 'info', message: `Row ${rowNum}: Student ${campId} already exists. Updated details.` });
        } else {
          const publicId = await getUniquePublicId();
          const qrCodeUrl = await generateStudentQRCode(publicId);
          student = await prisma.student.create({
            data: {
              campId: campId.toUpperCase(),
              fullName,
              age,
              hometown,
              publicId,
              qrCodeUrl,
              seasonId,
            },
          });
          logs.push({ type: 'success', message: `Row ${rowNum}: Student ${campId} created successfully.` });
        }

        successCount++;

        // 5. Look for matching files in the ZIP archive
        const campPrefix = campId.toLowerCase() + '_';
        const studentFiles = Object.keys(assetsMap).filter((k) => k.startsWith(campPrefix));

        if (studentFiles.length > 0) {
          logs.push({ type: 'info', message: `Student ${campId}: Found ${studentFiles.length} matching files in ZIP.` });

          // A. Avatar
          const avatarKey = studentFiles.find((k) => k.includes('avatar') || k.includes('profile'));
          if (avatarKey) {
            const file = assetsMap[avatarKey];
            const avatarUrl = await uploadImage(file.buffer, file.originalname, file.ext);
            await prisma.student.update({
              where: { id: student.id },
              data: { avatarUrl },
            });
            logs.push({ type: 'success', message: `Student ${campId}: Uploaded avatar image.` });
          }

          // B. Certificate
          const certKey = studentFiles.find((k) => k.includes('cert') || k.includes('certificate'));
          if (certKey) {
            const file = assetsMap[certKey];
            const certUrl = await uploadImage(file.buffer, file.originalname, file.ext);
            
            // Replaces certificate
            await prisma.certificate.deleteMany({ where: { studentId: student.id } });
            await prisma.certificate.create({ data: { studentId: student.id, imageUrl: certUrl } });

            logs.push({ type: 'success', message: `Student ${campId}: Uploaded certificate image.` });
          }

          // C. Album Activities
          const actKeys = studentFiles
            .filter((k) => k.includes('act') || k.includes('activity') || k.includes('album'))
            .sort();
          for (const actKey of actKeys) {
            const file = assetsMap[actKey];
            const imageUrl = await uploadImage(file.buffer, file.originalname, file.ext);

            const maxOrder = await prisma.activity.aggregate({
              where: { studentId: student.id },
              _max: { order: true },
            });
            const order = (maxOrder._max.order ?? -1) + 1;

            await prisma.activity.create({ data: { studentId: student.id, imageUrl, order } });
          }
          if (actKeys.length > 0) {
            logs.push({ type: 'success', message: `Student ${campId}: Uploaded ${actKeys.length} scrapbook photos.` });
          }

          // D. Projects
          const projFiles = studentFiles.filter((k) => k.includes('proj') || k.includes('project'));
          const projectCodes = Array.from(
            new Set(
              projFiles
                .map((k) => {
                  const match = k.match(/_proj(ect)?(\d+)/i);
                  return match ? match[0] : null;
                })
                .filter(Boolean)
            )
          );

          for (const projCode of projectCodes) {
            const matchedFiles = projFiles.filter((k) => k.includes(projCode!));
            const pptFile = matchedFiles.find((k) => k.endsWith('.pptx') || k.endsWith('.ppt'));
            const pdfFile = matchedFiles.find((k) => k.endsWith('.pdf'));
            const coverFile = matchedFiles.find(
              (k) => k.includes('cover') || k.endsWith('.jpg') || k.endsWith('.png') || k.endsWith('.jpeg')
            );

            let coverUrl = '';
            let pptUrl = '';
            let pdfUrl = '';

            if (coverFile) {
              const file = assetsMap[coverFile];
              coverUrl = await uploadImage(file.buffer, file.originalname, file.ext);
            }
            if (pptFile) {
              const file = assetsMap[pptFile];
              pptUrl = await uploadFile(file.buffer, file.originalname, file.ext);
            }
            if (pdfFile) {
              const file = assetsMap[pdfFile];
              pdfUrl = await uploadFile(file.buffer, file.originalname, file.ext);
            }

            const title = `Project ${projCode?.replace(/[^0-9]/g, '')}`;
            const maxOrder = await prisma.project.aggregate({
              where: { studentId: student.id },
              _max: { order: true },
            });
            const order = (maxOrder._max.order ?? -1) + 1;

            await prisma.project.create({
              data: {
                studentId: student.id,
                title,
                description: 'Imported Project',
                coverUrl: coverUrl || null,
                pptUrl: pptUrl || null,
                pdfUrl: pdfUrl || null,
                order,
              },
            });
            logs.push({ type: 'success', message: `Student ${campId}: Created project: ${title}` });
          }

          // E. Awards
          const awardFiles = studentFiles.filter((k) => k.includes('award') || k.includes('prize'));
          const awardCodes = Array.from(
            new Set(
              awardFiles
                .map((k) => {
                  const match = k.match(/_award(\d+)/i);
                  return match ? match[0] : null;
                })
                .filter(Boolean)
            )
          );

          const finalAwardCodes = awardCodes.length > 0 ? awardCodes : awardFiles.length > 0 ? ['_award'] : [];

          for (const awardCode of finalAwardCodes) {
            const awardFile = awardFiles.find((k) => k.includes(awardCode!));
            if (awardFile) {
              const file = assetsMap[awardFile];
              const imageUrl = await uploadImage(file.buffer, file.originalname, file.ext);
              const title = `Award ${awardCode?.replace(/[^0-9]/g, '') || ''}`.trim();
              
              await prisma.award.create({
                data: {
                  studentId: student.id,
                  title,
                  description: 'Imported Award',
                  imageUrl,
                },
              });
              logs.push({ type: 'success', message: `Student ${campId}: Created award: ${title}` });
            }
          }
        } else if (zipFile) {
          logs.push({ type: 'warning', message: `Student ${campId}: No matching files found in ZIP archive.` });
        }
      } catch (err: any) {
        console.error(`Error importing row ${rowNum} for ${campId}`, err);
        logs.push({
          type: 'error',
          message: `Row ${rowNum}: Failed to import Student ${campId}. Error: ${err.message || err}`,
        });
      }
    }

    logs.push({
      type: 'info',
      message: `Import process finished. Successfully processed ${successCount} out of ${rawData.length} students.`,
    });

    return NextResponse.json({ success: true, logs });
  } catch (err: any) {
    console.error('General import error:', err);
    return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
  }
}
