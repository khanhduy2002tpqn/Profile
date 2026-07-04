import { ImportService } from './import.service';
export declare class ImportController {
    private importService;
    constructor(importService: ImportService);
    importStudents(seasonId: string, files: {
        metadata?: Express.Multer.File[];
        zip?: Express.Multer.File[];
    }): Promise<any>;
}
