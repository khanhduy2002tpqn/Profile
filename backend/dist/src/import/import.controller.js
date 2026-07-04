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
exports.ImportController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const import_service_1 = require("./import.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let ImportController = class ImportController {
    importService;
    constructor(importService) {
        this.importService = importService;
    }
    async importStudents(seasonId, files) {
        if (!seasonId) {
            throw new common_1.BadRequestException('seasonId is required');
        }
        if (!files || !files.metadata || files.metadata.length === 0) {
            throw new common_1.BadRequestException('Metadata file is required (form-data field name: metadata)');
        }
        const metadataFile = files.metadata[0];
        const zipFile = files.zip && files.zip.length > 0 ? files.zip[0] : undefined;
        return this.importService.importData(seasonId, metadataFile, zipFile);
    }
};
exports.ImportController = ImportController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'metadata', maxCount: 1 },
        { name: 'zip', maxCount: 1 },
    ])),
    __param(0, (0, common_1.Query)('seasonId')),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ImportController.prototype, "importStudents", null);
exports.ImportController = ImportController = __decorate([
    (0, common_1.Controller)('import'),
    __metadata("design:paramtypes", [import_service_1.ImportService])
], ImportController);
//# sourceMappingURL=import.controller.js.map