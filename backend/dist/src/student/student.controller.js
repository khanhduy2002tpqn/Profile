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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const student_service_1 = require("./student.service");
const storage_service_1 = require("../storage/storage.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let StudentController = class StudentController {
    studentService;
    storageService;
    constructor(studentService, storageService) {
        this.studentService = studentService;
        this.storageService = storageService;
    }
    async getByPublicId(publicId) {
        return this.studentService.findByPublicId(publicId);
    }
    async lookupCampId(campId) {
        return this.studentService.lookupCampId(campId);
    }
    async findAll(seasonId, search, page, limit) {
        if (!seasonId) {
            throw new common_1.BadRequestException('seasonId is required');
        }
        return this.studentService.findAll(seasonId, search || '', page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 50);
    }
    async findOne(id) {
        return this.studentService.findOne(id);
    }
    async create(seasonId, body) {
        if (!seasonId) {
            throw new common_1.BadRequestException('seasonId is required in query params');
        }
        return this.studentService.create(seasonId, body);
    }
    async update(id, body) {
        return this.studentService.update(id, body);
    }
    async delete(id) {
        return this.studentService.delete(id);
    }
    async uploadAvatar(id, file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        const avatarUrl = await this.storageService.uploadImage(file);
        await this.studentService.update(id, { avatarUrl });
        return { avatarUrl };
    }
    async addActivity(id, file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        const imageUrl = await this.storageService.uploadImage(file);
        return this.studentService.addActivity(id, imageUrl);
    }
    async updateActivitiesOrder(id, ids) {
        if (!ids || !Array.isArray(ids)) {
            throw new common_1.BadRequestException('Invalid ids body parameter');
        }
        return this.studentService.updateActivitiesOrder(id, ids);
    }
    async deleteActivity(id, activityId) {
        return this.studentService.deleteActivity(id, activityId);
    }
    async addCertificate(id, file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        const imageUrl = await this.storageService.uploadImage(file);
        return this.studentService.addCertificate(id, imageUrl);
    }
    async deleteCertificate(id) {
        return this.studentService.deleteCertificate(id);
    }
    async createProject(id, body, files) {
        let coverUrl = '';
        let pptUrl = '';
        let pdfUrl = '';
        if (files?.cover?.[0]) {
            coverUrl = await this.storageService.uploadImage(files.cover[0]);
        }
        if (files?.ppt?.[0]) {
            pptUrl = await this.storageService.uploadFile(files.ppt[0]);
        }
        if (files?.pdf?.[0]) {
            pdfUrl = await this.storageService.uploadFile(files.pdf[0]);
        }
        return this.studentService.createProject(id, {
            title: body.title,
            description: body.description,
            videoUrl: body.videoUrl || '',
            coverUrl,
            pptUrl,
            pdfUrl,
            order: body.order ? parseInt(body.order, 10) : undefined,
        });
    }
    async updateProject(id, projectId, body, files) {
        const data = { ...body };
        if (body.order) {
            data.order = parseInt(body.order, 10);
        }
        if (files?.cover?.[0]) {
            data.coverUrl = await this.storageService.uploadImage(files.cover[0]);
        }
        if (files?.ppt?.[0]) {
            data.pptUrl = await this.storageService.uploadFile(files.ppt[0]);
        }
        if (files?.pdf?.[0]) {
            data.pdfUrl = await this.storageService.uploadFile(files.pdf[0]);
        }
        return this.studentService.updateProject(id, projectId, data);
    }
    async deleteProject(id, projectId) {
        return this.studentService.deleteProject(id, projectId);
    }
    async createAward(id, body, file) {
        let imageUrl = '';
        if (file) {
            imageUrl = await this.storageService.uploadImage(file);
        }
        return this.studentService.createAward(id, {
            title: body.title,
            description: body.description,
            icon: body.icon || 'trophy',
            imageUrl,
        });
    }
    async updateAward(id, awardId, body, file) {
        const data = { ...body };
        if (file) {
            data.imageUrl = await this.storageService.uploadImage(file);
        }
        return this.studentService.updateAward(id, awardId, data);
    }
    async deleteAward(id, awardId) {
        return this.studentService.deleteAward(id, awardId);
    }
    async downloadQRZip(seasonId, res) {
        if (!seasonId) {
            throw new common_1.BadRequestException('seasonId is required');
        }
        const archive = await this.studentService.generateSeasonQRZip(seasonId);
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=qr_codes_${seasonId}.zip`);
        archive.pipe(res);
    }
};
exports.StudentController = StudentController;
__decorate([
    (0, common_1.Get)('p/:publicId'),
    __param(0, (0, common_1.Param)('publicId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "getByPublicId", null);
__decorate([
    (0, common_1.Get)('lookup/:campId'),
    __param(0, (0, common_1.Param)('campId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "lookupCampId", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('seasonId')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Query)('seasonId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "delete", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/avatar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/activities'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "addActivity", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Put)(':id/activities/order'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('ids')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "updateActivitiesOrder", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id/activities/:activityId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('activityId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "deleteActivity", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/certificate'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "addCertificate", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id/certificate'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "deleteCertificate", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/projects'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'cover', maxCount: 1 },
        { name: 'ppt', maxCount: 1 },
        { name: 'pdf', maxCount: 1 },
    ])),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "createProject", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Put)(':id/projects/:projectId'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'cover', maxCount: 1 },
        { name: 'ppt', maxCount: 1 },
        { name: 'pdf', maxCount: 1 },
    ])),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "updateProject", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id/projects/:projectId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "deleteProject", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/awards'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "createAward", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Put)(':id/awards/:awardId'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('awardId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "updateAward", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id/awards/:awardId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('awardId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "deleteAward", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('qr/zip'),
    __param(0, (0, common_1.Query)('seasonId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "downloadQRZip", null);
exports.StudentController = StudentController = __decorate([
    (0, common_1.Controller)('students'),
    __metadata("design:paramtypes", [student_service_1.StudentService,
        storage_service_1.StorageService])
], StudentController);
//# sourceMappingURL=student.controller.js.map