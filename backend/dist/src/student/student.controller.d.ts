import { StudentService } from './student.service';
import { StorageService } from '../storage/storage.service';
export declare class StudentController {
    private studentService;
    private storageService;
    constructor(studentService: StudentService, storageService: StorageService);
    getByPublicId(publicId: string): Promise<{
        season: {
            organization: {
                id: string;
                slug: string;
                name: string;
                logoUrl: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            seasonCode: string;
            year: number;
            isActive: boolean;
        };
        activities: {
            id: string;
            createdAt: Date;
            studentId: string;
            imageUrl: string;
            order: number;
        }[];
        certificates: {
            id: string;
            createdAt: Date;
            studentId: string;
            imageUrl: string;
        }[];
        projects: {
            id: string;
            createdAt: Date;
            studentId: string;
            order: number;
            title: string;
            description: string;
            coverUrl: string | null;
            pptUrl: string | null;
            pdfUrl: string | null;
            videoUrl: string | null;
        }[];
        awards: {
            id: string;
            createdAt: Date;
            studentId: string;
            imageUrl: string | null;
            title: string;
            description: string;
            icon: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        seasonId: string;
        campId: string;
        publicId: string;
        fullName: string;
        age: number;
        hometown: string;
        avatarUrl: string | null;
        qrCodeUrl: string | null;
    }>;
    lookupCampId(campId: string): Promise<{
        publicId: string;
    }>;
    findAll(seasonId: string, search: string, page: string, limit: string): Promise<{
        items: ({
            activities: {
                id: string;
                createdAt: Date;
                studentId: string;
                imageUrl: string;
                order: number;
            }[];
            certificates: {
                id: string;
                createdAt: Date;
                studentId: string;
                imageUrl: string;
            }[];
            projects: {
                id: string;
                createdAt: Date;
                studentId: string;
                order: number;
                title: string;
                description: string;
                coverUrl: string | null;
                pptUrl: string | null;
                pdfUrl: string | null;
                videoUrl: string | null;
            }[];
            awards: {
                id: string;
                createdAt: Date;
                studentId: string;
                imageUrl: string | null;
                title: string;
                description: string;
                icon: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            seasonId: string;
            campId: string;
            publicId: string;
            fullName: string;
            age: number;
            hometown: string;
            avatarUrl: string | null;
            qrCodeUrl: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    findOne(id: string): Promise<{
        season: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            seasonCode: string;
            year: number;
            isActive: boolean;
        };
        activities: {
            id: string;
            createdAt: Date;
            studentId: string;
            imageUrl: string;
            order: number;
        }[];
        certificates: {
            id: string;
            createdAt: Date;
            studentId: string;
            imageUrl: string;
        }[];
        projects: {
            id: string;
            createdAt: Date;
            studentId: string;
            order: number;
            title: string;
            description: string;
            coverUrl: string | null;
            pptUrl: string | null;
            pdfUrl: string | null;
            videoUrl: string | null;
        }[];
        awards: {
            id: string;
            createdAt: Date;
            studentId: string;
            imageUrl: string | null;
            title: string;
            description: string;
            icon: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        seasonId: string;
        campId: string;
        publicId: string;
        fullName: string;
        age: number;
        hometown: string;
        avatarUrl: string | null;
        qrCodeUrl: string | null;
    }>;
    create(seasonId: string, body: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        seasonId: string;
        campId: string;
        publicId: string;
        fullName: string;
        age: number;
        hometown: string;
        avatarUrl: string | null;
        qrCodeUrl: string | null;
    }>;
    update(id: string, body: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        seasonId: string;
        campId: string;
        publicId: string;
        fullName: string;
        age: number;
        hometown: string;
        avatarUrl: string | null;
        qrCodeUrl: string | null;
    }>;
    delete(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        seasonId: string;
        campId: string;
        publicId: string;
        fullName: string;
        age: number;
        hometown: string;
        avatarUrl: string | null;
        qrCodeUrl: string | null;
    }>;
    uploadAvatar(id: string, file: Express.Multer.File): Promise<{
        avatarUrl: string;
    }>;
    addActivity(id: string, file: Express.Multer.File): Promise<{
        id: string;
        createdAt: Date;
        studentId: string;
        imageUrl: string;
        order: number;
    }>;
    updateActivitiesOrder(id: string, ids: string[]): Promise<{
        success: boolean;
    }>;
    deleteActivity(id: string, activityId: string): Promise<{
        id: string;
        createdAt: Date;
        studentId: string;
        imageUrl: string;
        order: number;
    }>;
    addCertificate(id: string, file: Express.Multer.File): Promise<{
        id: string;
        createdAt: Date;
        studentId: string;
        imageUrl: string;
    }>;
    deleteCertificate(id: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    createProject(id: string, body: any, files: {
        cover?: Express.Multer.File[];
        ppt?: Express.Multer.File[];
        pdf?: Express.Multer.File[];
    }): Promise<{
        id: string;
        createdAt: Date;
        studentId: string;
        order: number;
        title: string;
        description: string;
        coverUrl: string | null;
        pptUrl: string | null;
        pdfUrl: string | null;
        videoUrl: string | null;
    }>;
    updateProject(id: string, projectId: string, body: any, files: {
        cover?: Express.Multer.File[];
        ppt?: Express.Multer.File[];
        pdf?: Express.Multer.File[];
    }): Promise<{
        id: string;
        createdAt: Date;
        studentId: string;
        order: number;
        title: string;
        description: string;
        coverUrl: string | null;
        pptUrl: string | null;
        pdfUrl: string | null;
        videoUrl: string | null;
    }>;
    deleteProject(id: string, projectId: string): Promise<{
        id: string;
        createdAt: Date;
        studentId: string;
        order: number;
        title: string;
        description: string;
        coverUrl: string | null;
        pptUrl: string | null;
        pdfUrl: string | null;
        videoUrl: string | null;
    }>;
    createAward(id: string, body: any, file: Express.Multer.File): Promise<{
        id: string;
        createdAt: Date;
        studentId: string;
        imageUrl: string | null;
        title: string;
        description: string;
        icon: string;
    }>;
    updateAward(id: string, awardId: string, body: any, file: Express.Multer.File): Promise<{
        id: string;
        createdAt: Date;
        studentId: string;
        imageUrl: string | null;
        title: string;
        description: string;
        icon: string;
    }>;
    deleteAward(id: string, awardId: string): Promise<{
        id: string;
        createdAt: Date;
        studentId: string;
        imageUrl: string | null;
        title: string;
        description: string;
        icon: string;
    }>;
    downloadQRZip(seasonId: string, res: any): Promise<void>;
}
