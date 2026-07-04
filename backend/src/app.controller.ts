import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard/stats')
  async getStats(@Query('seasonId') seasonId: string) {
    if (!seasonId) {
      return {
        students: 0,
        photos: 0,
        projects: 0,
        awards: 0,
        certificates: 0,
      };
    }

    const [students, photos, projects, awards, certificates] = await Promise.all([
      this.prisma.student.count({ where: { seasonId } }),
      this.prisma.activity.count({
        where: { student: { seasonId } },
      }),
      this.prisma.project.count({
        where: { student: { seasonId } },
      }),
      this.prisma.award.count({
        where: { student: { seasonId } },
      }),
      this.prisma.certificate.count({
        where: { student: { seasonId } },
      }),
    ]);

    return {
      students,
      photos,
      projects,
      awards,
      certificates,
    };
  }
}
