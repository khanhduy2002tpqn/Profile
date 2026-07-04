import { SeasonService } from './season.service';
export declare class SeasonController {
    private seasonService;
    constructor(seasonService: SeasonService);
    getActivePublic(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        seasonCode: string;
        year: number;
        isActive: boolean;
    } | null>;
    findAll(user: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        seasonCode: string;
        year: number;
        isActive: boolean;
    }[]>;
    getActive(user: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        seasonCode: string;
        year: number;
        isActive: boolean;
    } | null>;
    findOne(user: any, id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        seasonCode: string;
        year: number;
        isActive: boolean;
    } | null>;
    create(user: any, body: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        seasonCode: string;
        year: number;
        isActive: boolean;
    }>;
    update(user: any, id: string, body: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        seasonCode: string;
        year: number;
        isActive: boolean;
    }>;
    delete(user: any, id: string): Promise<{
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
