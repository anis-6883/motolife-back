import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  UseGuards,
  Put,
} from '@nestjs/common';
import { CreateLandingSectionDto } from './dto/create-landing-section.dto';
import { UpdateLandingSectionDto } from './dto/update-landing-section.dto';
import { LandingSectionService } from './landing-section.service';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';

@Controller()
@UseGuards(PermissionsGuard)
export class LandingSectionController {
  constructor(private readonly landingSectionService: LandingSectionService) {}

  @Post()
  //@RequirePermissions(PERMISSIONS.ALL)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createLandingSectionDto: CreateLandingSectionDto) {
    return this.landingSectionService.create(createLandingSectionDto);
  }

  @Get()
  //@RequirePermissions(PERMISSIONS.ALL)
  findAll() {
    return this.landingSectionService.findAllLandingSections();
  }

  @Patch('sort')
  //@RequirePermissions(PERMISSIONS.ALL)
  sort(@Body() { sortedIds }: { sortedIds: string[] }) {
    return this.landingSectionService.sort(sortedIds);
  }

  @Put(':id')
  //@RequirePermissions(PERMISSIONS.ALL)
  update(
    @Param('id') id: string,
    @Body() updateLandingSectionDto: UpdateLandingSectionDto,
  ) {
    return this.landingSectionService.update(id, updateLandingSectionDto);
  }

  @Delete(':id')
  //@RequirePermissions(PERMISSIONS.PRODUCT)
  remove(@Param('id') id: string) {
    return this.landingSectionService.remove(id);
  }
}
