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
  Query,
} from '@nestjs/common';
import { CreateProductDto } from '../../../common/dtos/products/create-products.dto';
import {
  UpdateProductDto,
  UpdateVariantDto,
} from '../../../common/dtos/products/update-products.dto';
import { ProductService } from './product.service';
import { GetProductsQueryDto } from '../../../common/dtos/products/get-products-query.dto';
import { PRODUCT_STATUS } from 'src/common/enums/products.enum';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import type { IActiveUser } from '../auth/interfaces/active-user.interface';

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createProductDto: CreateProductDto,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.productService.create(createProductDto, user);
  }

  @Get()
  findAll(
    @Query() query: GetProductsQueryDto,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.productService.findAll(query, user);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.productService.updateRequest(id, updateProductDto, user);
  }

  @Patch(':id/variant/:sku')
  updateVariant(
    @Param('id') id: string,
    @Param('sku') sku: string,
    @Body() variantDto: UpdateVariantDto,
  ) {
    return this.productService.updateVariant(id, sku, variantDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() { status }: { status: PRODUCT_STATUS },
  ) {
    return this.productService.updateStatus(id, status);
  }

  @Delete(':id/variant/:sku')
  removeVariant(@Param('id') id: string, @Param('sku') sku: string) {
    return this.productService.removeVariant(id, sku);
  }
}
