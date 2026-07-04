import { v2 as cloudinary } from 'cloudinary';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

let isCloudinaryConfigured = false;
let isS3Configured = false;
let s3Client: S3Client | null = null;

// Initialize Cloudinary
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
  isCloudinaryConfigured = true;
}

// Initialize S3
if (
  process.env.AWS_S3_BUCKET &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY
) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  isS3Configured = true;
}

/**
 * Helper to save files locally to next.js public directory during fallback.
 */
function saveFileLocally(buffer: Buffer, originalname: string): string {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fileExt = path.extname(originalname);
  const cleanBase = path.basename(originalname, fileExt).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${Date.now()}_${cleanBase}${fileExt}`;
  const filepath = path.join(uploadDir, filename);

  fs.writeFileSync(filepath, buffer);
  console.log(`Saved file locally: ${filepath}`);
  
  // Next.js serves public folder assets at the root path `/uploads/...`
  return `/uploads/${filename}`;
}

/**
 * Upload image to Cloudinary (or local fallback).
 */
export async function uploadImage(
  buffer: Buffer,
  originalname: string,
  mimetype?: string
): Promise<string> {
  if (isCloudinaryConfigured) {
    try {
      return await new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'summercamp_digital_portfolio' },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error, falling back to local', error);
              return reject(error);
            }
            if (result && result.secure_url) {
              resolve(result.secure_url);
            } else {
              reject(new Error('Cloudinary secure url not found'));
            }
          }
        );
        uploadStream.end(buffer);
      });
    } catch (err) {
      console.warn('Failed to upload to Cloudinary. Saving locally to public/uploads.');
    }
  }
  return saveFileLocally(buffer, originalname);
}

/**
 * Upload documents to AWS S3 (or local fallback).
 */
export async function uploadFile(
  buffer: Buffer,
  originalname: string,
  mimetype?: string
): Promise<string> {
  if (isS3Configured && s3Client) {
    try {
      const fileExt = path.extname(originalname);
      const cleanBase = path.basename(originalname, fileExt).replace(/[^a-zA-Z0-9_-]/g, '_');
      const key = `${Date.now()}_${cleanBase}${fileExt}`;

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: mimetype || 'application/octet-stream',
      });

      await s3Client.send(command);
      const region = process.env.AWS_REGION || 'us-east-1';
      return `https://${process.env.AWS_S3_BUCKET}.s3.${region}.amazonaws.com/${key}`;
    } catch (err) {
      console.error('AWS S3 upload error, falling back to local', err);
    }
  }
  return saveFileLocally(buffer, originalname);
}
