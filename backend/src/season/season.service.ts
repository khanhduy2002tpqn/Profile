import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SeasonService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    return this.prisma.season.findMany({
      where: { organizationId: orgId },
      orderBy: { year: 'desc' },
    });
  }

  async findOne(orgId: string, id: string) {
    return this.prisma.season.findFirst({
      where: { id, organizationId: orgId },
    });
  }

  async findActive(orgId: string) {
    return this.prisma.season.findFirst({
      where: { organizationId: orgId, isActive: true },
    });
  }

  async findActivePublic() {
    const org = await this.prisma.organization.findUnique({
      where: { slug: 'summer-camp' },
    });
    if (!org) return null;
    return this.prisma.season.findFirst({
      where: { organizationId: org.id, isActive: true },
    });
  }

  async create(orgId: string, data: { seasonCode: string; name: string; year: number; isActive?: boolean }) {
    const existing = await this.prisma.season.findUnique({
      where: {
        organizationId_seasonCode: {
          organizationId: orgId,
          seasonCode: data.seasonCode,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(`Season code ${data.seasonCode} already exists in this organization`);
    }

    if (data.isActive) {
      // Deactivate other seasons in this organization
      await this.prisma.season.updateMany({
        where: { organizationId: orgId, isActive: true },
        data: { isActive: false },
      });
    }

    return this.prisma.season.create({
      data: {
        seasonCode: data.seasonCode,
        name: data.name,
        year: data.year,
        isActive: data.isActive ?? false,
        organizationId: orgId,
      },
    });
  }

  async update(orgId: string, id: string, data: { name?: string; year?: number; isActive?: boolean }) {
    const existing = await this.findOne(orgId, id);
    if (!existing) {
      throw new BadRequestException('Season not found');
    }

    if (data.isActive && !existing.isActive) {
      // Deactivate other seasons in this organization
      await this.prisma.season.updateMany({
        where: { organizationId: orgId, isActive: true },
        data: { isActive: false },
      });
    }

    return this.prisma.season.update({
      where: { id },
      data,
    });
  }

  async delete(orgId: string, id: string) {
    const existing = await this.findOne(orgId, id);
    if (!existing) {
      throw new BadRequestException('Season not found');
    }

    return this.prisma.season.delete({
      where: { id },
    });
  }
}
