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
import { ProductService } from './product.service';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { ActiveUser } from '../admin-auth/decorators/active-user.decorator';
import type { IActiveUser } from 'src/modules/customer/auth/interfaces/active-user.interface';
import { CreateProductDto } from 'src/common/dtos/products/create-products.dto';
import { GetProductsQueryDto } from 'src/common/dtos/products/get-products-query.dto';
import {
  UpdateProductDto,
  UpdateVariantDto,
} from 'src/common/dtos/products/update-products.dto';

@Controller()
@UseGuards(PermissionsGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  create(
    @Body() createProductDto: CreateProductDto,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.productService.create(createProductDto, user);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  findAll(@Query() query: GetProductsQueryDto) {
    return this.productService.findAllInhouse(query);
  }

  @Get('sellers')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  findAllSellerProducts(@Query() query: GetProductsQueryDto) {
    return this.productService.findAllVendorProducts(query);
  }

  @Get('dropdown')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  findAllProductsForDropdown(@Query() query: GetProductsQueryDto) {
    return this.productService.findAllProductsForDropdown(query);
  }

  @Get('variant/:variation')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  getProductsOfVariant(@Param('variation') variation: string) {
    return this.productService.getProductsOfVariant(variation);
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
    @Body()
    updateProductDto: UpdateProductDto & {
      _thumbnailUploaded: boolean;
      _deletedImages: string[];
      _deletedSizeGuideImages: string[];
    },
    @ActiveUser() user: IActiveUser,
  ) {
    return this.productService.update(id, updateProductDto, user);
  }

  @Put(':id/variant/:sku')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  updateVariant(
    @Param('id') id: string,
    @Param('sku') sku: string,
    @Body() variantDto: UpdateVariantDto,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.productService.updateVariant(id, sku, variantDto, user);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  remove(@Param('id') id: string, @ActiveUser() user: IActiveUser) {
    return this.productService.remove(id, user);
  }

  @Delete(':id/variant/:sku')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  removeVariant(
    @Param('id') id: string,
    @Param('sku') sku: string,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.productService.removeVariant(id, sku, user);
  }
}
