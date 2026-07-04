import { PrismaService } from '../prisma.service';
import { StorageService } from '../storage/storage.service';
import { Readable } from 'stream';
export declare class StudentService {
    private prisma;
    private storageService;
    private readonly logger;
    constructor(prisma: PrismaService, storageService: StorageService);
    private getUniquePublicId;
    generateStudentQRCode(publicId: string): Promise<string>;
    findAll(seasonId: string, search?: string, page?: number, limit?: number): Promise<{
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
    findByPublicId(publicId: string): Promise<{
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
    create(seasonId: string, data: {
        campId: string;
        fullName: string;
        age: number;
        hometown: string;
        avatarUrl?: string;
    }): Promise<{
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
    update(id: string, data: {
        fullName?: string;
        age?: number;
        hometown?: string;
        avatarUrl?: string;
    }): Promise<{
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
    addActivity(studentId: string, imageUrl: string): Promise<{
        id: string;
        createdAt: Date;
        studentId: string;
        imageUrl: string;
        order: number;
    }>;
    updateActivitiesOrder(studentId: string, ids: string[]): Promise<{
        success: boolean;
    }>;
    deleteActivity(studentId: string, activityId: string): Promise<{
        id: string;
        createdAt: Date;
        studentId: string;
        imageUrl: string;
        order: number;
    }>;
    addCertificate(studentId: string, imageUrl: string): Promise<{
        id: string;
        createdAt: Date;
        studentId: string;
        imageUrl: string;
    }>;
    deleteCertificate(studentId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    createProject(studentId: string, data: {
        title: string;
        description: string;
        coverUrl?: string;
        pptUrl?: string;
        pdfUrl?: string;
        videoUrl?: string;
        order?: number;
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
    updateProject(studentId: string, projectId: string, data: {
        title?: string;
        description?: string;
        coverUrl?: string;
        pptUrl?: string;
        pdfUrl?: string;
        videoUrl?: string;
        order?: number;
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
    deleteProject(studentId: string, projectId: string): Promise<{
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
    createAward(studentId: string, data: {
        title: string;
        description: string;
        icon?: string;
        imageUrl?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        studentId: string;
        imageUrl: string | null;
        title: string;
        description: string;
        icon: string;
    }>;
    updateAward(studentId: string, awardId: string, data: {
        title?: string;
        description?: string;
        icon?: string;
        imageUrl?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        studentId: string;
        imageUrl: string | null;
        title: string;
        description: string;
        icon: string;
    }>;
    deleteAward(studentId: string, awardId: string): Promise<{
        id: string;
        createdAt: Date;
        studentId: string;
        imageUrl: string | null;
        title: string;
        description: string;
        icon: string;
    }>;
    generateSeasonQRZip(seasonId: string): Promise<Readable>;
}
