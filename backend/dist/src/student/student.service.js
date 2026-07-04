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
var StudentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const storage_service_1 = require("../storage/storage.service");
const QRCode = __importStar(require("qrcode"));
const archiver = require('archiver');
function generateRandomId(length = 9) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
let StudentService = StudentService_1 = class StudentService {
    prisma;
    storageService;
    logger = new common_1.Logger(StudentService_1.name);
    constructor(prisma, storageService) {
        this.prisma = prisma;
        this.storageService = storageService;
    }
    async getUniquePublicId() {
        while (true) {
            const publicId = generateRandomId(9);
            const existing = await this.prisma.student.findUnique({
                where: { publicId },
            });
            if (!existing)
                return publicId;
        }
    }
    async generateStudentQRCode(publicId) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const portfolioUrl = `${frontendUrl}/p/${publicId}`;
        try {
            const qrBuffer = await QRCode.toBuffer(portfolioUrl, {
                type: 'png',
                width: 512,
                margin: 2,
            });
            return await this.storageService.uploadImage({
                buffer: qrBuffer,
                originalname: `qr_${publicId}.png`,
                mimetype: 'image/png',
            });
        }
        catch (error) {
            this.logger.error(`Error generating QR code for ${publicId}`, error);
            throw new common_1.BadRequestException('Failed to generate QR code');
        }
    }
    async findAll(seasonId, search = '', page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const where = { seasonId };
        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { campId: { contains: search, mode: 'insensitive' } },
                { hometown: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [items, total] = await Promise.all([
            this.prisma.student.findMany({
                where,
                skip,
                take: limit,
                orderBy: { campId: 'asc' },
                include: {
                    projects: true,
                    awards: true,
                    activities: true,
                    certificates: true,
                },
            }),
            this.prisma.student.count({ where }),
        ]);
        return { items, total, page, limit, pages: Math.ceil(total / limit) };
    }
    async findOne(id) {
        const student = await this.prisma.student.findUnique({
            where: { id },
            include: {
                projects: { orderBy: { order: 'asc' } },
                awards: true,
                activities: { orderBy: { order: 'asc' } },
                certificates: true,
                season: true,
            },
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        return student;
    }
    async findByPublicId(publicId) {
        const student = await this.prisma.student.findUnique({
            where: { publicId },
            include: {
                projects: { orderBy: { order: 'asc' } },
                awards: true,
                activities: { orderBy: { order: 'asc' } },
                certificates: true,
                season: {
                    include: {
                        organization: true,
                    },
                },
            },
        });
        if (!student) {
            throw new common_1.NotFoundException('Portfolio not found');
        }
        return student;
    }
    async lookupCampId(campId) {
        const student = await this.prisma.student.findFirst({
            where: { campId: { equals: campId, mode: 'insensitive' } },
            select: { publicId: true },
        });
        if (!student) {
            throw new common_1.NotFoundException('CampID not found');
        }
        return student;
    }
    async create(seasonId, data) {
        const existing = await this.prisma.student.findUnique({
            where: {
                seasonId_campId: {
                    seasonId,
                    campId: data.campId,
                },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException(`CampID ${data.campId} already exists in this season`);
        }
        const publicId = await this.getUniquePublicId();
        const qrCodeUrl = await this.generateStudentQRCode(publicId);
        return this.prisma.student.create({
            data: {
                ...data,
                publicId,
                qrCodeUrl,
                seasonId,
            },
        });
    }
    async update(id, data) {
        const student = await this.findOne(id);
        return this.prisma.student.update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        await this.findOne(id);
        return this.prisma.student.delete({
            where: { id },
        });
    }
    async addActivity(studentId, imageUrl) {
        const maxOrder = await this.prisma.activity.aggregate({
            where: { studentId },
            _max: { order: true },
        });
        const order = (maxOrder._max.order ?? -1) + 1;
        return this.prisma.activity.create({
            data: { studentId, imageUrl, order },
        });
    }
    async updateActivitiesOrder(studentId, ids) {
        await this.prisma.$transaction(ids.map((id, index) => this.prisma.activity.updateMany({
            where: { id, studentId },
            data: { order: index },
        })));
        return { success: true };
    }
    async deleteActivity(studentId, activityId) {
        const activity = await this.prisma.activity.findFirst({
            where: { id: activityId, studentId },
        });
        if (!activity) {
            throw new common_1.NotFoundException('Activity image not found');
        }
        return this.prisma.activity.delete({
            where: { id: activityId },
        });
    }
    async addCertificate(studentId, imageUrl) {
        await this.prisma.certificate.deleteMany({
            where: { studentId },
        });
        return this.prisma.certificate.create({
            data: { studentId, imageUrl },
        });
    }
    async deleteCertificate(studentId) {
        return this.prisma.certificate.deleteMany({
            where: { studentId },
        });
    }
    async createProject(studentId, data) {
        const maxOrder = await this.prisma.project.aggregate({
            where: { studentId },
            _max: { order: true },
        });
        const order = data.order ?? ((maxOrder._max.order ?? -1) + 1);
        return this.prisma.project.create({
            data: {
                ...data,
                studentId,
                order,
            },
        });
    }
    async updateProject(studentId, projectId, data) {
        const project = await this.prisma.project.findFirst({
            where: { id: projectId, studentId },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        return this.prisma.project.update({
            where: { id: projectId },
            data,
        });
    }
    async deleteProject(studentId, projectId) {
        const project = await this.prisma.project.findFirst({
            where: { id: projectId, studentId },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        return this.prisma.project.delete({
            where: { id: projectId },
        });
    }
    async createAward(studentId, data) {
        return this.prisma.award.create({
            data: {
                ...data,
                studentId,
            },
        });
    }
    async updateAward(studentId, awardId, data) {
        const award = await this.prisma.award.findFirst({
            where: { id: awardId, studentId },
        });
        if (!award) {
            throw new common_1.NotFoundException('Award not found');
        }
        return this.prisma.award.update({
            where: { id: awardId },
            data,
        });
    }
    async deleteAward(studentId, awardId) {
        const award = await this.prisma.award.findFirst({
            where: { id: awardId, studentId },
        });
        if (!award) {
            throw new common_1.NotFoundException('Award not found');
        }
        return this.prisma.award.delete({
            where: { id: awardId },
        });
    }
    async generateSeasonQRZip(seasonId) {
        const students = await this.prisma.student.findMany({
            where: { seasonId },
            select: { campId: true, publicId: true },
        });
        const archive = archiver('zip', {
            zlib: { level: 9 },
        });
        (async () => {
            try {
                for (const student of students) {
                    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                    const portfolioUrl = `${frontendUrl}/p/${student.publicId}`;
                    const qrBuffer = await QRCode.toBuffer(portfolioUrl, {
                        type: 'png',
                        width: 512,
                        margin: 2,
                    });
                    archive.append(qrBuffer, { name: `${student.campId}_qr.png` });
                }
                await archive.finalize();
            }
            catch (err) {
                archive.emit('error', err);
            }
        })();
        return archive;
    }
};
exports.StudentService = StudentService;
exports.StudentService = StudentService = StudentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService])
], StudentService);
//# sourceMappingURL=student.service.js.map