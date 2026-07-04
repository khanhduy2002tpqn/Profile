"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeasonService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let SeasonService = class SeasonService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(orgId) {
        return this.prisma.season.findMany({
            where: { organizationId: orgId },
            orderBy: { year: 'desc' },
        });
    }
    async findOne(orgId, id) {
        return this.prisma.season.findFirst({
            where: { id, organizationId: orgId },
        });
    }
    async findActive(orgId) {
        return this.prisma.season.findFirst({
            where: { organizationId: orgId, isActive: true },
        });
    }
    async findActivePublic() {
        const org = await this.prisma.organization.findUnique({
            where: { slug: 'summer-camp' },
        });
        if (!org)
            return null;
        return this.prisma.season.findFirst({
            where: { organizationId: org.id, isActive: true },
        });
    }
    async create(orgId, data) {
        const existing = await this.prisma.season.findUnique({
            where: {
                organizationId_seasonCode: {
                    organizationId: orgId,
                    seasonCode: data.seasonCode,
                },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException(`Season code ${data.seasonCode} already exists in this organization`);
        }
        if (data.isActive) {
            await this.prisma.season.updateMany({
                where: { organizationId: orgId, isActive: true },
                data: { isActive: false },
            });
        }
        return this.prisma.season.create({
            data: {
                seasonCode: data.seasonCode,
                name: data.name,
                year: data.year,
                isActive: data.isActive ?? false,
                organizationId: orgId,
            },
        });
    }
    async update(orgId, id, data) {
        const existing = await this.findOne(orgId, id);
        if (!existing) {
            throw new common_1.BadRequestException('Season not found');
        }
        if (data.isActive && !existing.isActive) {
            await this.prisma.season.updateMany({
                where: { organizationId: orgId, isActive: true },
                data: { isActive: false },
            });
        }
        return this.prisma.season.update({
            where: { id },
            data,
        });
    }
    async delete(orgId, id) {
        const existing = await this.findOne(orgId, id);
        if (!existing) {
            throw new common_1.BadRequestException('Season not found');
        }
        return this.prisma.season.delete({
            where: { id },
        });
    }
};
exports.SeasonService = SeasonService;
exports.SeasonService = SeasonService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SeasonService);
//# sourceMappingURL=season.service.js.map