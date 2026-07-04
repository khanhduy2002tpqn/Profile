import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StorageService } from '../storage/storage.service';
import { StudentService } from '../student/student.service';
import * as XLSX from 'xlsx';
import AdmZip from 'adm-zip';
import * as path from 'path';

export interface ImportLog {
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private studentService: StudentService,
  ) {}

  async importData(
    seasonId: string,
    metadataFile: Express.Multer.File,
    zipFile?: Express.Multer.File,
  ) {
    const logs: ImportLog[] = [];
    logs.push({ type: 'info', message: 'Starting bulk import process...' });

    // 1. Verify Season
    const season = await this.prisma.season.findUnique({
      where: { id: seasonId },
    });
    if (!season) {
      throw new BadRequestException('Active season not found');
    }

    // 2. Parse Excel/CSV
    let rawData: any[] = [];
    try {
      const workbook = XLSX.read(metadataFile.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      rawData = XLSX.utils.sheet_to_json<any>(worksheet);
      logs.push({ type: 'info', message: `Parsed ${rawData.length} rows from metadata file.` });
    } catch (err) {
      this.logger.error('Error parsing metadata file', err);
      logs.push({ type: 'error', message: 'Failed to parse metadata file. Must be valid Excel/CSV.' });
      return { success: false, logs };
    }

    if (rawData.length === 0) {
      logs.push({ type: 'error', message: 'Metadata file is empty.' });
      return { success: false, logs };
    }

    // 3. Map Zip entries if present
    const assetsMap: { [filename: string]: { buffer: Buffer; originalname: string; ext: string } } = {};
    if (zipFile) {
      try {
        const zip = new AdmZip(zipFile.buffer);
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
        this.logger.error('Error extracting ZIP file', err);
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
        let student = await this.prisma.student.findFirst({
          where: { seasonId, campId: { equals: campId, mode: 'insensitive' } },
        });

        if (student) {
          student = await this.prisma.student.update({
            where: { id: student.id },
            data: { fullName, age, hometown },
          });
          logs.push({ type: 'info', message: `Row ${rowNum}: Student ${campId} already exists. Updated details.` });
        } else {
          student = await this.studentService.create(seasonId, {
            campId,
            fullName,
            age,
            hometown,
          });
          logs.push({ type: 'success', message: `Row ${rowNum}: Student ${campId} created successfully.` });
        }

        successCount++;

        // 5. Look for matching files in the ZIP archive
        const campPrefix = campId.toLowerCase() + '_';
        const studentFiles = Object.keys(assetsMap).filter(k => k.startsWith(campPrefix));

        if (studentFiles.length > 0) {
          logs.push({ type: 'info', message: `Student ${campId}: Found ${studentFiles.length} matching files in ZIP.` });

          // Categorize and upload
          // A. Avatar
          const avatarKey = studentFiles.find(k => k.includes('avatar') || k.includes('profile'));
          if (avatarKey) {
            const file = assetsMap[avatarKey];
            const avatarUrl = await this.storageService.uploadImage(file);
            await this.prisma.student.update({
              where: { id: student.id },
              data: { avatarUrl },
            });
            logs.push({ type: 'success', message: `Student ${campId}: Uploaded avatar image.` });
          }

          // B. Certificate
          const certKey = studentFiles.find(k => k.includes('cert') || k.includes('certificate'));
          if (certKey) {
            const file = assetsMap[certKey];
            const certUrl = await this.storageService.uploadImage(file);
            await this.studentService.addCertificate(student.id, certUrl);
            logs.push({ type: 'success', message: `Student ${campId}: Uploaded certificate image.` });
          }

          // C. Album Activities
          const actKeys = studentFiles
            .filter(k => k.includes('act') || k.includes('activity') || k.includes('album'))
            .sort();
          for (const actKey of actKeys) {
            const file = assetsMap[actKey];
            const imageUrl = await this.storageService.uploadImage(file);
            await this.studentService.addActivity(student.id, imageUrl);
          }
          if (actKeys.length > 0) {
            logs.push({ type: 'success', message: `Student ${campId}: Uploaded ${actKeys.length} scrapbook photos.` });
          }

          // D. Projects
          // We group project files by key suffix (e.g. project1, project01, project02, etc.)
          const projFiles = studentFiles.filter(k => k.includes('proj') || k.includes('project'));
          // Get distinct project suffixes
          const projectCodes = Array.from(new Set(
            projFiles.map(k => {
              const match = k.match(/_proj(ect)?(\d+)/i);
              return match ? match[0] : null;
            }).filter(Boolean)
          ));

          for (const projCode of projectCodes) {
            const matchedFiles = projFiles.filter(k => k.includes(projCode!));
            const pptFile = matchedFiles.find(k => k.endsWith('.pptx') || k.endsWith('.ppt'));
            const pdfFile = matchedFiles.find(k => k.endsWith('.pdf'));
            const coverFile = matchedFiles.find(k => k.includes('cover') || k.endsWith('.jpg') || k.endsWith('.png') || k.endsWith('.jpeg'));

            let coverUrl = '';
            let pptUrl = '';
            let pdfUrl = '';

            if (coverFile) coverUrl = await this.storageService.uploadImage(assetsMap[coverFile]);
            if (pptFile) pptUrl = await this.storageService.uploadFile(assetsMap[pptFile]);
            if (pdfFile) pdfUrl = await this.storageService.uploadFile(assetsMap[pdfFile]);

            const title = `Project ${projCode?.replace(/[^0-9]/g, '')}`;
            await this.studentService.createProject(student.id, {
              title,
              description: 'Imported Project',
              coverUrl: coverUrl || undefined,
              pptUrl: pptUrl || undefined,
              pdfUrl: pdfUrl || undefined,
            });
            logs.push({ type: 'success', message: `Student ${campId}: Created project: ${title}` });
          }

          // E. Awards
          const awardFiles = studentFiles.filter(k => k.includes('award') || k.includes('prize'));
          const awardCodes = Array.from(new Set(
            awardFiles.map(k => {
              const match = k.match(/_award(\d+)/i);
              return match ? match[0] : null;
            }).filter(Boolean)
          ));

          // If no award digits found, but award files exist, handle single award
          const finalAwardCodes = awardCodes.length > 0 ? awardCodes : (awardFiles.length > 0 ? ['_award'] : []);

          for (const awardCode of finalAwardCodes) {
            const awardFile = awardFiles.find(k => k.includes(awardCode!));
            if (awardFile) {
              const imageUrl = await this.storageService.uploadImage(assetsMap[awardFile]);
              const title = `Award ${awardCode?.replace(/[^0-9]/g, '') || ''}`.trim();
              await this.studentService.createAward(student.id, {
                title,
                description: 'Imported Award',
                imageUrl,
              });
              logs.push({ type: 'success', message: `Student ${campId}: Created award: ${title}` });
            }
          }
        } else if (zipFile) {
          logs.push({ type: 'warning', message: `Student ${campId}: No matching files found in ZIP archive.` });
        }
      } catch (err) {
        this.logger.error(`Error importing row ${rowNum} for ${campId}`, err);
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

    return { success: true, logs };
  }
}
