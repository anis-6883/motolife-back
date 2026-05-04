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
  Query,
  Put,
} from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandService } from './brand.service';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { GetBrandsQueryDto } from './dto/get-brands-query.dto';

@Controller()
@UseGuards(PermissionsGuard)
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.PRODUCT_BRAND)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandService.create(createBrandDto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.PRODUCT_BRAND)
  findAll(@Query() query: GetBrandsQueryDto) {
    return this.brandService.findAll(query);
  }

  @Patch('sort')
  @RequirePermissions(PERMISSIONS.PRODUCT_BRAND)
  sort(@Body() { sortedIds }: { sortedIds: string[] }) {
    return this.brandService.sort(sortedIds);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PRODUCT_BRAND)
  findById(@Param('id') id: string) {
    return this.brandService.findById(id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.PRODUCT_BRAND)
  update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto) {
    return this.brandService.update(id, updateBrandDto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PRODUCT_BRAND)
  remove(@Param('id') id: string) {
    return this.brandService.remove(id);
  }

  @Patch(':id/status')
  @RequirePermissions(PERMISSIONS.PRODUCT_BRAND)
  updateStatus(
    @Param('id') id: string,
    @Body() { status }: { status: boolean },
  ) {
    return this.brandService.updateStatus(id, status);
  }
}
