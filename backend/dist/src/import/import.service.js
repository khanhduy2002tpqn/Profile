"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ImportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const storage_service_1 = require("../storage/storage.service");
const student_service_1 = require("../student/student.service");
const XLSX = __importStar(require("xlsx"));
const adm_zip_1 = __importDefault(require("adm-zip"));
const path = __importStar(require("path"));
let ImportService = ImportService_1 = class ImportService {
    prisma;
    storageService;
    studentService;
    logger = new common_1.Logger(ImportService_1.name);
    constructor(prisma, storageService, studentService) {
        this.prisma = prisma;
        this.storageService = storageService;
        this.studentService = studentService;
    }
    async importData(seasonId, metadataFile, zipFile) {
        const logs = [];
        logs.push({ type: 'info', message: 'Starting bulk import process...' });
        const season = await this.prisma.season.findUnique({
            where: { id: seasonId },
        });
        if (!season) {
            throw new common_1.BadRequestException('Active season not found');
        }
        let rawData = [];
        try {
            const workbook = XLSX.read(metadataFile.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            rawData = XLSX.utils.sheet_to_json(worksheet);
            logs.push({ type: 'info', message: `Parsed ${rawData.length} rows from metadata file.` });
        }
        catch (err) {
            this.logger.error('Error parsing metadata file', err);
            logs.push({ type: 'error', message: 'Failed to parse metadata file. Must be valid Excel/CSV.' });
            return { success: false, logs };
        }
        if (rawData.length === 0) {
            logs.push({ type: 'error', message: 'Metadata file is empty.' });
            return { success: false, logs };
        }
        const assetsMap = {};
        if (zipFile) {
            try {
                const zip = new adm_zip_1.default(zipFile.buffer);
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
            }
            catch (err) {
                this.logger.error('Error extracting ZIP file', err);
                logs.push({ type: 'warning', message: 'Failed to extract ZIP archive. Proceeding with metadata only.' });
            }
        }
        let successCount = 0;
        for (let index = 0; index < rawData.length; index++) {
            const row = rawData[index];
            const rowNum = index + 2;
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
                let student = await this.prisma.student.findFirst({
                    where: { seasonId, campId: { equals: campId, mode: 'insensitive' } },
                });
                if (student) {
                    student = await this.prisma.student.update({
                        where: { id: student.id },
                        data: { fullName, age, hometown },
                    });
                    logs.push({ type: 'info', message: `Row ${rowNum}: Student ${campId} already exists. Updated details.` });
                }
                else {
                    student = await this.studentService.create(seasonId, {
                        campId,
                        fullName,
                        age,
                        hometown,
                    });
                    logs.push({ type: 'success', message: `Row ${rowNum}: Student ${campId} created successfully.` });
                }
                successCount++;
                const campPrefix = campId.toLowerCase() + '_';
                const studentFiles = Object.keys(assetsMap).filter(k => k.startsWith(campPrefix));
                if (studentFiles.length > 0) {
                    logs.push({ type: 'info', message: `Student ${campId}: Found ${studentFiles.length} matching files in ZIP.` });
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
                    const certKey = studentFiles.find(k => k.includes('cert') || k.includes('certificate'));
                    if (certKey) {
                        const file = assetsMap[certKey];
                        const certUrl = await this.storageService.uploadImage(file);
                        await this.studentService.addCertificate(student.id, certUrl);
                        logs.push({ type: 'success', message: `Student ${campId}: Uploaded certificate image.` });
                    }
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
                    const projFiles = studentFiles.filter(k => k.includes('proj') || k.includes('project'));
                    const projectCodes = Array.from(new Set(projFiles.map(k => {
                        const match = k.match(/_proj(ect)?(\d+)/i);
                        return match ? match[0] : null;
                    }).filter(Boolean)));
                    for (const projCode of projectCodes) {
                        const matchedFiles = projFiles.filter(k => k.includes(projCode));
                        const pptFile = matchedFiles.find(k => k.endsWith('.pptx') || k.endsWith('.ppt'));
                        const pdfFile = matchedFiles.find(k => k.endsWith('.pdf'));
                        const coverFile = matchedFiles.find(k => k.includes('cover') || k.endsWith('.jpg') || k.endsWith('.png') || k.endsWith('.jpeg'));
                        let coverUrl = '';
                        let pptUrl = '';
                        let pdfUrl = '';
                        if (coverFile)
                            coverUrl = await this.storageService.uploadImage(assetsMap[coverFile]);
                        if (pptFile)
                            pptUrl = await this.storageService.uploadFile(assetsMap[pptFile]);
                        if (pdfFile)
                            pdfUrl = await this.storageService.uploadFile(assetsMap[pdfFile]);
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
                    const awardFiles = studentFiles.filter(k => k.includes('award') || k.includes('prize'));
                    const awardCodes = Array.from(new Set(awardFiles.map(k => {
                        const match = k.match(/_award(\d+)/i);
                        return match ? match[0] : null;
                    }).filter(Boolean)));
                    const finalAwardCodes = awardCodes.length > 0 ? awardCodes : (awardFiles.length > 0 ? ['_award'] : []);
                    for (const awardCode of finalAwardCodes) {
                        const awardFile = awardFiles.find(k => k.includes(awardCode));
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
                }
                else if (zipFile) {
                    logs.push({ type: 'warning', message: `Student ${campId}: No matching files found in ZIP archive.` });
                }
            }
            catch (err) {
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
};
exports.ImportService = ImportService;
exports.ImportService = ImportService = ImportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService,
        student_service_1.StudentService])
], ImportService);
//# sourceMappingURL=import.service.js.map