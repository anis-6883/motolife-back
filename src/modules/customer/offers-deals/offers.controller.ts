import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { OffersService } from './offers.service';
import { GetOffersQueryDto } from './dto/get-offers-query.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from 'src/common/enums/auth-type.enum';
import { GetOfferItemsQueryDto } from './dto/get-offer-items-query.dto';

@Controller()
@Auth(AuthType.None)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get()
  findOffer(@Query() query: GetOffersQueryDto) {
    return this.offersService.findOffer(query);
  }

  @Get('flash-sale')
  getFlashSale() {
    return this.offersService.getFlashSale();
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.offersService.findBySlug(slug);
  }

  @Get(':slug/items')
  findOfferItems(
    @Param('slug') slug: string,
    @Query() query: GetOfferItemsQueryDto,
  ) {
    return this.offersService.findOfferItems(slug, query);
  }
}
