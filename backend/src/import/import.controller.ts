import { Controller, Post, Query, UseGuards, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('import')
export class ImportController {
  constructor(private importService: ImportService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'metadata', maxCount: 1 },
      { name: 'zip', maxCount: 1 },
    ]),
  )
  async importStudents(
    @Query('seasonId') seasonId: string,
    @UploadedFiles()
    files: {
      metadata?: Express.Multer.File[];
      zip?: Express.Multer.File[];
    },
  ): Promise<any> {
    if (!seasonId) {
      throw new BadRequestException('seasonId is required');
    }
    if (!files || !files.metadata || files.metadata.length === 0) {
      throw new BadRequestException('Metadata file is required (form-data field name: metadata)');
    }

    const metadataFile = files.metadata[0];
    const zipFile = files.zip && files.zip.length > 0 ? files.zip[0] : undefined;

    return this.importService.importData(seasonId, metadataFile, zipFile);
  }
}
