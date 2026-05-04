import {
  Controller,
  Get,
  Body,
  Param,
  Post,
  HttpCode,
  HttpStatus,
  Query,
  Delete,
} from '@nestjs/common';
import { WishListService } from './wishlist.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { GetWishListQueryDto } from './dto/get-wishlist.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from 'src/common/enums/auth-type.enum';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { type IActiveUser } from '../auth/interfaces/active-user.interface';

@Controller()
@Auth(AuthType.Bearer)
export class WishListController {
  constructor(private readonly reviewService: WishListService) {}

  @Post()
  @HttpCode(HttpStatus.OK) // 200 because it's a toggle, not always a creation
  create(
    @ActiveUser() user: IActiveUser,
    @Body() createWishListDto: CreateWishlistDto,
  ) {
    return this.reviewService.createWishList(user, createWishListDto);
  }

  @Get()
  findAll(
    @ActiveUser() user: IActiveUser,
    @Query() query: GetWishListQueryDto,
  ) {
    return this.reviewService.getWishList(user, query);
  }
  @Get('status')
  checkStatus(
    @ActiveUser() user: IActiveUser,
    @Query('productId') productId: string,
    @Query('variantSku') variantSku?: string,
    @Query('isCombo') isCombo?: string,
  ) {
    return this.reviewService.checkWishlistStatus(
      user,
      productId,
      variantSku,
      isCombo === 'true',
    );
  }

  @Delete('product/:id')
  removeByProductId(@ActiveUser() user: IActiveUser, @Param('id') id: string) {
    return this.reviewService.removeFromWishList(user, id);
  }

  @Delete(':id')
  remove(@ActiveUser() user: IActiveUser, @Param('id') id: string) {
    return this.reviewService.removeFromWishList(user, id);
  }
}
