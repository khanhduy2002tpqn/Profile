import { PrismaService } from '../prisma.service';
export declare class SeasonService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(orgId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        seasonCode: string;
        year: number;
        isActive: boolean;
    }[]>;
    findOne(orgId: string, id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        seasonCode: string;
        year: number;
        isActive: boolean;
    } | null>;
    findActive(orgId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        seasonCode: string;
        year: number;
        isActive: boolean;
    } | null>;
    findActivePublic(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        seasonCode: string;
        year: number;
        isActive: boolean;
    } | null>;
    create(orgId: string, data: {
        seasonCode: string;
        name: string;
        year: number;
        isActive?: boolean;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        seasonCode: string;
        year: number;
        isActive: boolean;
    }>;
    update(orgId: string, id: string, data: {
        name?: string;
        year?: number;
        isActive?: boolean;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        seasonCode: string;
        year: number;
        isActive: boolean;
    }>;
    delete(orgId: string, id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        seasonCode: string;
        year: number;
        isActive: boolean;
    }>;
}
