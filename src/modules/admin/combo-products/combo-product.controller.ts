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

import { ComboProductService } from './combo-product.service';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { CreateComboProductDto } from 'src/common/dtos/combo-products/create-combo-products.dto';
import { GetComboProductsQueryDto } from 'src/common/dtos/combo-products/get-combo-products-query.dto';
import { UpdateComboProductDto } from 'src/common/dtos/combo-products/update-combo-products.dto';
import { ActiveUser } from '../admin-auth/decorators/active-user.decorator';
import type { IActiveUser } from '../admin-auth/interfaces/active-user.interface';
import { CreateComboBannerDto } from './dto/create-combo-banner.dto';

@Controller()
@UseGuards(PermissionsGuard)
export class ComboProductController {
  constructor(private readonly productService: ComboProductService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  create(
    @Body() createComboProductDto: CreateComboProductDto,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.productService.create(createComboProductDto, user);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  findAll(@Query() query: GetComboProductsQueryDto) {
    return this.productService.findAll(query);
  }

  @Get('dropdown')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  getDropdown(@Query() query: GetComboProductsQueryDto) {
    return this.productService.getDropdown(query);
  }

  @Post('banner')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  addBannerImage(@Body() dto: CreateComboBannerDto) {
    return this.productService.addBannerImage(dto);
  }

  @Get('banner')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  getBanner() {
    return this.productService.getComboBanner();
  }

  @Patch('banner/:id')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  updateBanner(@Param('id') id: string, @Body() dto: CreateComboBannerDto) {
    return this.productService.updateBanner(id, dto);
  }

  @Delete('banner/:id')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  deleteBanner(@Param('id') id: string) {
    return this.productService.deleteBanner(id);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  findById(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  update(
    @Param('id') id: string,
    @Body() updateComboProductDto: UpdateComboProductDto,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.productService.update(id, updateComboProductDto, user);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  remove(@Param('id') id: string, @ActiveUser() user: IActiveUser) {
    return this.productService.remove(id, user);
  }
}
