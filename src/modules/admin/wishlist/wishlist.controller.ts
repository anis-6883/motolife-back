import { Controller, Get, Param } from '@nestjs/common';
import { WishlistService } from './wishlist.service';

@Controller()
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get('user/:userId')
  getWishlistByUserId(@Param('userId') userId: string) {
    return this.wishlistService.getWishlistByUserId(userId);
  }
}
