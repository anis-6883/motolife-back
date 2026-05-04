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
import { CreateOffersDto, OffersItemDto } from './dto/create-offer.dto';
import { UpdateOffersDto } from './dto/update-offer.dto';
import { OffersService } from './offers.service';
import { GetOffersQueryDto } from './dto/get-offers-query.dto';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { type IActiveUser } from '../auth/interfaces/active-user.interface';

@Controller()
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createOffersDto: CreateOffersDto) {
    return this.offersService.create(createOffersDto);
  }

  @Get()
  findAll(@ActiveUser() user: IActiveUser, @Query() query: GetOffersQueryDto) {
    return this.offersService.findAll(user, query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.offersService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOffersDto: UpdateOffersDto) {
    return this.offersService.update(id, updateOffersDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.offersService.remove(id);
  }

  @Patch(':id/product')
  addProduct(@Param('id') id: string, @Body() productDto: OffersItemDto) {
    return this.offersService.addProduct(id, productDto);
  }

  @Delete(':id/product/:productId')
  removeProduct(
    @Param('id') id: string,
    @Param('productId') productId: string,
  ) {
    return this.offersService.removeProduct(id, productId);
  }
}
