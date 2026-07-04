import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SeasonService } from './season.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('seasons')
export class SeasonController {
  constructor(private seasonService: SeasonService) {}

  @Get('active-public')
  async getActivePublic() {
    // Public endpoint for frontend landing pages to know the current active season config
    // Default to first organization's active season (or let it be configurable)
    // For SaaS, we can use the default 'summer-camp' organization slug
    const defaultOrg = 'summer-camp';
    const org = await this.seasonService.findActive(defaultOrg); 
    // Wait, the findActive requires orgId. We need to query organization by slug first or hardcode orgId.
    // To make it simple, we can support getting active season by org slug, or let this controller locate it.
    // Let's implement active public with query or default slug in the service/controller.
    return this.seasonService.findActivePublic();
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.seasonService.findAll(user.organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('active')
  async getActive(@CurrentUser() user: any) {
    return this.seasonService.findActive(user.organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.seasonService.findOne(user.organizationId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@CurrentUser() user: any, @Body() body: any) {
    return this.seasonService.create(user.organizationId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.seasonService.update(user.organizationId, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.seasonService.delete(user.organizationId, id);
  }
}
