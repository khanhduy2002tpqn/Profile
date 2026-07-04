export declare class StorageService {
    private readonly logger;
    private s3Client;
    private isCloudinaryConfigured;
    private isS3Configured;
    constructor();
    private getLocalUrl;
    private saveFileLocally;
    uploadImage(file: {
        buffer: Buffer;
        originalname: string;
        mimetype?: string;
    }): Promise<string>;
    uploadFile(file: {
        buffer: Buffer;
        originalname: string;
        mimetype?: string;
    }): Promise<string>;
}
