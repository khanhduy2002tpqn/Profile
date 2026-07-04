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
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const cloudinary_1 = require("cloudinary");
const client_s3_1 = require("@aws-sdk/client-s3");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let StorageService = StorageService_1 = class StorageService {
    logger = new common_1.Logger(StorageService_1.name);
    s3Client = null;
    isCloudinaryConfigured = false;
    isS3Configured = false;
    constructor() {
        if (process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET) {
            cloudinary_1.v2.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
            });
            this.isCloudinaryConfigured = true;
            this.logger.log('Cloudinary storage engine initialized.');
        }
        else {
            this.logger.warn('Cloudinary not configured. Falling back to local storage for images.');
        }
        if (process.env.AWS_S3_BUCKET &&
            process.env.AWS_ACCESS_KEY_ID &&
            process.env.AWS_SECRET_ACCESS_KEY) {
            this.s3Client = new client_s3_1.S3Client({
                region: process.env.AWS_REGION || 'us-east-1',
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                },
            });
            this.isS3Configured = true;
            this.logger.log('AWS S3 storage engine initialized.');
        }
        else {
            this.logger.warn('AWS S3 not configured. Falling back to local storage for files.');
        }
    }
    getLocalUrl(filename) {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        return `${backendUrl}/uploads/${filename}`;
    }
    saveFileLocally(file) {
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const fileExt = path.extname(file.originalname);
        const cleanBase = path.basename(file.originalname, fileExt)
            .replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${Date.now()}_${cleanBase}${fileExt}`;
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, file.buffer);
        this.logger.log(`Saved file locally: ${filepath}`);
        return this.getLocalUrl(filename);
    }
    async uploadImage(file) {
        if (this.isCloudinaryConfigured) {
            try {
                return await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary_1.v2.uploader.upload_stream({ folder: 'summercamp_digital_portfolio' }, (error, result) => {
                        if (error) {
                            this.logger.error('Cloudinary upload error, falling back to local', error);
                            return reject(error);
                        }
                        if (result && result.secure_url) {
                            resolve(result.secure_url);
                        }
                        else {
                            reject(new Error('Cloudinary secure url not found'));
                        }
                    });
                    uploadStream.end(file.buffer);
                });
            }
            catch (err) {
                this.logger.warn('Failed to upload to Cloudinary. Saving locally as fallback.');
            }
        }
        return this.saveFileLocally(file);
    }
    async uploadFile(file) {
        if (this.isS3Configured && this.s3Client) {
            try {
                const fileExt = path.extname(file.originalname);
                const cleanBase = path.basename(file.originalname, fileExt)
                    .replace(/[^a-zA-Z0-9_-]/g, '_');
                const key = `${Date.now()}_${cleanBase}${fileExt}`;
                const command = new client_s3_1.PutObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: key,
                    Body: file.buffer,
                    ContentType: file.mimetype || 'application/octet-stream',
                });
                await this.s3Client.send(command);
                const region = process.env.AWS_REGION || 'us-east-1';
                return `https://${process.env.AWS_S3_BUCKET}.s3.${region}.amazonaws.com/${key}`;
            }
            catch (err) {
                this.logger.error('AWS S3 upload error, falling back to local', err);
                this.logger.warn('Failed to upload to AWS S3. Saving locally as fallback.');
            }
        }
        return this.saveFileLocally(file);
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], StorageService);
//# sourceMappingURL=storage.service.js.map