import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { GetProductsQueryDto } from '../../../common/dtos/products/get-products-query.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from 'src/common/enums/auth-type.enum';
import { RestockRequestDto } from './dtos/restock-request.dto';
import { FlashSalesQueryDto } from './dtos/get-flash-sales.dto';

@Controller()
@Auth(AuthType.None)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  findAll(@Query() query: GetProductsQueryDto) {
    return this.productService.findAll(query);
  }

  @Get('/slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productService.findBySlug(slug);
  }

  @Get('flash-sales')
  getFlashSales(@Query() query: FlashSalesQueryDto) {
    return this.productService.getFlashSales(query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  @Get('/:id/related')
  relatedProducts(
    @Param('id') id: string,
    @Query() query: Pick<GetProductsQueryDto, 'page' | 'limit'>,
  ) {
    return this.productService.relatedProducts(id, query);
  }

  @Post('restock/request')
  createRestockRequest(@Body() restockRequestDto: RestockRequestDto) {
    return this.productService.requestRestock(restockRequestDto);
  }
}
