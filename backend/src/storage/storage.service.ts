import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;
  private isCloudinaryConfigured = false;
  private isS3Configured = false;

  constructor() {
    // Check Cloudinary configuration
    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      this.isCloudinaryConfigured = true;
      this.logger.log('Cloudinary storage engine initialized.');
    } else {
      this.logger.warn('Cloudinary not configured. Falling back to local storage for images.');
    }

    // Check S3 configuration
    if (
      process.env.AWS_S3_BUCKET &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY
    ) {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
      this.isS3Configured = true;
      this.logger.log('AWS S3 storage engine initialized.');
    } else {
      this.logger.warn('AWS S3 not configured. Falling back to local storage for files.');
    }
  }

  /**
   * Helper to format local URLs.
   */
  private getLocalUrl(filename: string): string {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    return `${backendUrl}/uploads/${filename}`;
  }

  /**
   * Save a file to local disk under the uploads folder.
   */
  private saveFileLocally(file: { buffer: Buffer; originalname: string }): string {
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

  /**
   * Upload an image. Tries Cloudinary first, then falls back to local.
   */
  async uploadImage(file: { buffer: Buffer; originalname: string; mimetype?: string }): Promise<string> {
    if (this.isCloudinaryConfigured) {
      try {
        return await new Promise<string>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'summercamp_digital_portfolio' },
            (error, result) => {
              if (error) {
                this.logger.error('Cloudinary upload error, falling back to local', error);
                return reject(error);
              }
              if (result && result.secure_url) {
                resolve(result.secure_url);
              } else {
                reject(new Error('Cloudinary secure url not found'));
              }
            }
          );
          uploadStream.end(file.buffer);
        });
      } catch (err) {
        this.logger.warn('Failed to upload to Cloudinary. Saving locally as fallback.');
      }
    }
    return this.saveFileLocally(file);
  }

  /**
   * Upload a general document (PDF, PPT). Tries AWS S3 first, then falls back to local.
   */
  async uploadFile(file: { buffer: Buffer; originalname: string; mimetype?: string }): Promise<string> {
    if (this.isS3Configured && this.s3Client) {
      try {
        const fileExt = path.extname(file.originalname);
        const cleanBase = path.basename(file.originalname, fileExt)
          .replace(/[^a-zA-Z0-9_-]/g, '_');
        const key = `${Date.now()}_${cleanBase}${fileExt}`;

        const command = new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET!,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype || 'application/octet-stream',
        });

        await this.s3Client.send(command);
        const region = process.env.AWS_REGION || 'us-east-1';
        return `https://${process.env.AWS_S3_BUCKET}.s3.${region}.amazonaws.com/${key}`;
      } catch (err) {
        this.logger.error('AWS S3 upload error, falling back to local', err);
        this.logger.warn('Failed to upload to AWS S3. Saving locally as fallback.');
      }
    }
    return this.saveFileLocally(file);
  }
}
