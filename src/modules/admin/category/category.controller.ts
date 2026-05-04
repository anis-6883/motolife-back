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
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryService } from './category.service';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { GetCategoryQueryDto } from './dto/get-category-query.dto';

@Controller()
@UseGuards(PermissionsGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  findAllCategories(@Query() query: GetCategoryQueryDto) {
    return this.categoryService.findAllCategories(query);
  }

  @Patch('sort')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  sort(@Body() { sortedIds }: { sortedIds: string[] }) {
    return this.categoryService.sort(sortedIds);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  findById(@Param('id') id: string) {
    return this.categoryService.findById(id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }

  // @Patch(':id/status')
  // //@RequirePermissions(PERMISSIONS.PRODUCT)
  // updateStatus(
  //   @Param('id') id: string,
  //   @Body() statusData: { status: boolean },
  // ) {
  //   return this.categoryService.updateStatus(id, statusData);
  // }
}
