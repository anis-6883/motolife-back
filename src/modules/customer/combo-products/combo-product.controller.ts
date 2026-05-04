import { Controller, Get, Param, Query } from '@nestjs/common';
import { ComboProductService } from './combo-product.service';
import { GetComboProductsQueryDto } from 'src/common/dtos/combo-products/get-combo-products-query.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from 'src/common/enums/auth-type.enum';

@Controller()
@Auth(AuthType.None)
export class ComboProductController {
  constructor(private readonly productService: ComboProductService) {}

  @Get()
  findAll(@Query() query: GetComboProductsQueryDto) {
    return this.productService.findAll(query);
  }

  @Get('banner')
  getBanner() {
    return this.productService.getComboBanner();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productService.findBySlug(slug);
  }
}
