import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { StudentService } from './student.service';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response } from 'express';

@Controller('students')
export class StudentController {
  constructor(
    private studentService: StudentService,
    private storageService: StorageService,
  ) {}

  // --- Public Portfolio Search & Details ---
  @Get('p/:publicId')
  async getByPublicId(@Param('publicId') publicId: string) {
    return this.studentService.findByPublicId(publicId);
  }

  @Get('lookup/:campId')
  async lookupCampId(@Param('campId') campId: string) {
    return this.studentService.lookupCampId(campId);
  }

  // --- Admin Student Management CRUD ---
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @Query('seasonId') seasonId: string,
    @Query('search') search: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    if (!seasonId) {
      throw new BadRequestException('seasonId is required');
    }
    return this.studentService.findAll(
      seasonId,
      search || '',
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.studentService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Query('seasonId') seasonId: string, @Body() body: any) {
    if (!seasonId) {
      throw new BadRequestException('seasonId is required in query params');
    }
    return this.studentService.create(seasonId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.studentService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.studentService.delete(id);
  }

  // --- Profile Avatar Upload ---
  @UseGuards(JwtAuthGuard)
  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const avatarUrl = await this.storageService.uploadImage(file);
    await this.studentService.update(id, { avatarUrl });
    return { avatarUrl };
  }

  // --- Scrapbook (Activity) Image Uploads ---
  @UseGuards(JwtAuthGuard)
  @Post(':id/activities')
  @UseInterceptors(FileInterceptor('file'))
  async addActivity(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const imageUrl = await this.storageService.uploadImage(file);
    return this.studentService.addActivity(id, imageUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/activities/order')
  async updateActivitiesOrder(@Param('id') id: string, @Body('ids') ids: string[]) {
    if (!ids || !Array.isArray(ids)) {
      throw new BadRequestException('Invalid ids body parameter');
    }
    return this.studentService.updateActivitiesOrder(id, ids);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/activities/:activityId')
  async deleteActivity(@Param('id') id: string, @Param('activityId') activityId: string) {
    return this.studentService.deleteActivity(id, activityId);
  }

  // --- Certificate Image Uploads ---
  @UseGuards(JwtAuthGuard)
  @Post(':id/certificate')
  @UseInterceptors(FileInterceptor('file'))
  async addCertificate(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const imageUrl = await this.storageService.uploadImage(file);
    return this.studentService.addCertificate(id, imageUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/certificate')
  async deleteCertificate(@Param('id') id: string) {
    return this.studentService.deleteCertificate(id);
  }

  // --- Project CRUD ---
  @UseGuards(JwtAuthGuard)
  @Post(':id/projects')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cover', maxCount: 1 },
      { name: 'ppt', maxCount: 1 },
      { name: 'pdf', maxCount: 1 },
    ]),
  )
  async createProject(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles()
    files: {
      cover?: Express.Multer.File[];
      ppt?: Express.Multer.File[];
      pdf?: Express.Multer.File[];
    },
  ) {
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

  @UseGuards(JwtAuthGuard)
  @Put(':id/projects/:projectId')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cover', maxCount: 1 },
      { name: 'ppt', maxCount: 1 },
      { name: 'pdf', maxCount: 1 },
    ]),
  )
  async updateProject(
    @Param('id') id: string,
    @Param('projectId') projectId: string,
    @Body() body: any,
    @UploadedFiles()
    files: {
      cover?: Express.Multer.File[];
      ppt?: Express.Multer.File[];
      pdf?: Express.Multer.File[];
    },
  ) {
    const data: any = { ...body };
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

  @UseGuards(JwtAuthGuard)
  @Delete(':id/projects/:projectId')
  async deleteProject(@Param('id') id: string, @Param('projectId') projectId: string) {
    return this.studentService.deleteProject(id, projectId);
  }

  // --- Awards CRUD ---
  @UseGuards(JwtAuthGuard)
  @Post(':id/awards')
  @UseInterceptors(FileInterceptor('file'))
  async createAward(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
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

  @UseGuards(JwtAuthGuard)
  @Put(':id/awards/:awardId')
  @UseInterceptors(FileInterceptor('file'))
  async updateAward(
    @Param('id') id: string,
    @Param('awardId') awardId: string,
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const data = { ...body };
    if (file) {
      data.imageUrl = await this.storageService.uploadImage(file);
    }
    return this.studentService.updateAward(id, awardId, data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/awards/:awardId')
  async deleteAward(@Param('id') id: string, @Param('awardId') awardId: string) {
    return this.studentService.deleteAward(id, awardId);
  }

  // --- Bulk QR Code ZIP Download ---
  @UseGuards(JwtAuthGuard)
  @Get('qr/zip')
  async downloadQRZip(@Query('seasonId') seasonId: string, @Res() res: any) {
    if (!seasonId) {
      throw new BadRequestException('seasonId is required');
    }
    const archive = await this.studentService.generateSeasonQRZip(seasonId);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=qr_codes_${seasonId}.zip`);

    archive.pipe(res);
  }
}
