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
} from '@nestjs/common';
import { ComboProductService } from './combo-product.service';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import type { IActiveUser } from '../auth/interfaces/active-user.interface';
import { CreateComboProductDto } from 'src/common/dtos/combo-products/create-combo-products.dto';
import { GetComboProductsQueryDto } from 'src/common/dtos/combo-products/get-combo-products-query.dto';
import { UpdateComboProductDto } from 'src/common/dtos/combo-products/update-combo-products.dto';

@Controller()
export class ComboProductController {
  constructor(private readonly productService: ComboProductService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createComboProductDto: CreateComboProductDto,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.productService.create(createComboProductDto, user);
  }

  @Get()
  findAll(@Query() query: GetComboProductsQueryDto) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateComboProductDto: UpdateComboProductDto,
  ) {
    return this.productService.update(id, updateComboProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
