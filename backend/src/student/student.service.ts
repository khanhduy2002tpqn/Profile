import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StorageService } from '../storage/storage.service';
import * as QRCode from 'qrcode';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const archiver = require('archiver');
import { Readable } from 'stream';

function generateRandomId(length = 9): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  private async getUniquePublicId(): Promise<string> {
    while (true) {
      const publicId = generateRandomId(9);
      const existing = await this.prisma.student.findUnique({
        where: { publicId },
      });
      if (!existing) return publicId;
    }
  }

  async generateStudentQRCode(publicId: string): Promise<string> {
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
    } catch (error) {
      this.logger.error(`Error generating QR code for ${publicId}`, error);
      throw new BadRequestException('Failed to generate QR code');
    }
  }

  async findAll(seasonId: string, search = '', page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const where: any = { seasonId };
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

  async findOne(id: string) {
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
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async findByPublicId(publicId: string) {
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
      throw new NotFoundException('Portfolio not found');
    }

    return student;
  }

  async lookupCampId(campId: string) {
    const student = await this.prisma.student.findFirst({
      where: { campId: { equals: campId, mode: 'insensitive' } },
      select: { publicId: true },
    });

    if (!student) {
      throw new NotFoundException('CampID not found');
    }

    return student;
  }

  async create(seasonId: string, data: {
    campId: string;
    fullName: string;
    age: number;
    hometown: string;
    avatarUrl?: string;
  }) {
    const existing = await this.prisma.student.findUnique({
      where: {
        seasonId_campId: {
          seasonId,
          campId: data.campId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(`CampID ${data.campId} already exists in this season`);
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

  async update(id: string, data: {
    fullName?: string;
    age?: number;
    hometown?: string;
    avatarUrl?: string;
  }) {
    const student = await this.findOne(id);
    return this.prisma.student.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.student.delete({
      where: { id },
    });
  }

  // --- Activities CRUD ---
  async addActivity(studentId: string, imageUrl: string) {
    const maxOrder = await this.prisma.activity.aggregate({
      where: { studentId },
      _max: { order: true },
    });
    const order = (maxOrder._max.order ?? -1) + 1;

    return this.prisma.activity.create({
      data: { studentId, imageUrl, order },
    });
  }

  async updateActivitiesOrder(studentId: string, ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.activity.updateMany({
          where: { id, studentId },
          data: { order: index },
        }),
      ),
    );
    return { success: true };
  }

  async deleteActivity(studentId: string, activityId: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id: activityId, studentId },
    });
    if (!activity) {
      throw new NotFoundException('Activity image not found');
    }
    return this.prisma.activity.delete({
      where: { id: activityId },
    });
  }

  // --- Certificate CRUD ---
  async addCertificate(studentId: string, imageUrl: string) {
    // Delete existing certificate if any
    await this.prisma.certificate.deleteMany({
      where: { studentId },
    });

    return this.prisma.certificate.create({
      data: { studentId, imageUrl },
    });
  }

  async deleteCertificate(studentId: string) {
    return this.prisma.certificate.deleteMany({
      where: { studentId },
    });
  }

  // --- Projects CRUD ---
  async createProject(studentId: string, data: {
    title: string;
    description: string;
    coverUrl?: string;
    pptUrl?: string;
    pdfUrl?: string;
    videoUrl?: string;
    order?: number;
  }) {
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

  async updateProject(studentId: string, projectId: string, data: {
    title?: string;
    description?: string;
    coverUrl?: string;
    pptUrl?: string;
    pdfUrl?: string;
    videoUrl?: string;
    order?: number;
  }) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, studentId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data,
    });
  }

  async deleteProject(studentId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, studentId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.project.delete({
      where: { id: projectId },
    });
  }

  // --- Awards CRUD ---
  async createAward(studentId: string, data: {
    title: string;
    description: string;
    icon?: string;
    imageUrl?: string;
  }) {
    return this.prisma.award.create({
      data: {
        ...data,
        studentId,
      },
    });
  }

  async updateAward(studentId: string, awardId: string, data: {
    title?: string;
    description?: string;
    icon?: string;
    imageUrl?: string;
  }) {
    const award = await this.prisma.award.findFirst({
      where: { id: awardId, studentId },
    });
    if (!award) {
      throw new NotFoundException('Award not found');
    }

    return this.prisma.award.update({
      where: { id: awardId },
      data,
    });
  }

  async deleteAward(studentId: string, awardId: string) {
    const award = await this.prisma.award.findFirst({
      where: { id: awardId, studentId },
    });
    if (!award) {
      throw new NotFoundException('Award not found');
    }

    return this.prisma.award.delete({
      where: { id: awardId },
    });
  }

  // --- QR ZIP Generation ---
  async generateSeasonQRZip(seasonId: string): Promise<Readable> {
    const students = await this.prisma.student.findMany({
      where: { seasonId },
      select: { campId: true, publicId: true },
    });

    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    });

    // Run async generation and piping
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
      } catch (err) {
        archive.emit('error', err);
      }
    })();

    return archive;
  }
}
