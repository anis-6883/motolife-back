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
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { GetOffersQueryDto } from './dto/get-offers-query.dto';
import { GetOfferItemsQueryDto } from './dto/get-offer-items-query.dto';

@Controller()
@UseGuards(PermissionsGuard)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.OFFERS_AND_DEALS)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createOffersDto: CreateOffersDto) {
    return this.offersService.create(createOffersDto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.OFFERS_AND_DEALS)
  findAll(@Query() query: GetOffersQueryDto) {
    return this.offersService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.OFFERS_AND_DEALS)
  findById(@Param('id') id: string) {
    return this.offersService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.OFFERS_AND_DEALS)
  update(@Param('id') id: string, @Body() updateOffersDto: UpdateOffersDto) {
    return this.offersService.update(id, updateOffersDto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.OFFERS_AND_DEALS)
  remove(@Param('id') id: string) {
    return this.offersService.remove(id);
  }

  @Get(':id/items')
  @RequirePermissions(PERMISSIONS.OFFERS_AND_DEALS)
  findOfferItems(
    @Param('id') id: string,
    @Query() query: GetOfferItemsQueryDto,
  ) {
    return this.offersService.findOfferItems(id, query);
  }

  @Patch(':id/product')
  @RequirePermissions(PERMISSIONS.OFFERS_AND_DEALS)
  addProduct(@Param('id') id: string, @Body() productDto: OffersItemDto) {
    return this.offersService.addProduct(id, productDto);
  }

  @Delete(':id/product/:productId')
  @RequirePermissions(PERMISSIONS.OFFERS_AND_DEALS)
  removeProduct(
    @Param('id') id: string,
    @Param('productId') productId: string,
  ) {
    return this.offersService.removeProduct(id, productId);
  }
}
