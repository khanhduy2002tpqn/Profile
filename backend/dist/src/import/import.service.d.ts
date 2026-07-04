import { PrismaService } from '../prisma.service';
import { StorageService } from '../storage/storage.service';
import { StudentService } from '../student/student.service';
export interface ImportLog {
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
}
export declare class ImportService {
    private prisma;
    private storageService;
    private studentService;
    private readonly logger;
    constructor(prisma: PrismaService, storageService: StorageService, studentService: StudentService);
    importData(seasonId: string, metadataFile: Express.Multer.File, zipFile?: Express.Multer.File): Promise<{
        success: boolean;
        logs: ImportLog[];
    }>;
}
