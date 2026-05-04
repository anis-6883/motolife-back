import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  HttpStatus,
  HttpCode,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { RemoveFromCartDto } from './dto/remove-from-cart.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from 'src/common/enums/auth-type.enum';
import { CreateCartDto } from './dto/create-cart.dto';
import { IdentityGuard } from 'src/common/guards/identity.guard';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import type { UserIdentity } from 'src/common/interfaces/identity.interface';
import { type IActiveUser } from '../auth/interfaces/active-user.interface';
import { ApplyCouponDto } from './dto/apply-coupon.dto';

@Controller()
@Auth(AuthType.None)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('/create')
  @HttpCode(HttpStatus.OK)
  @UseGuards(IdentityGuard)
  createCart(@ActiveUser() user: UserIdentity, @Body() body: CreateCartDto) {
    return this.cartService.createCart(user, body);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(IdentityGuard)
  addToCart(
    @Body()
    body: AddToCartDto,
    @ActiveUser() user: UserIdentity,
  ) {
    return this.cartService.addToCart(user, body);
  }

  @Get()
  @UseGuards(IdentityGuard)
  @Auth(AuthType.None)
  getCart(
    @ActiveUser() user: UserIdentity,
    @Query() query: { guestId: string },
  ) {
    return this.cartService.getCart(user, query.guestId);
  }

  @Post('apply-coupon')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.Bearer)
  applyCoupon(@ActiveUser() user: IActiveUser, @Body() dto: ApplyCouponDto) {
    return this.cartService.applyCoupon(user, dto);
  }

  @Patch()
  @UseGuards(IdentityGuard)
  updateCartItem(
    @ActiveUser() user: UserIdentity,
    @Body()
    body: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(user, body);
  }

  @Delete()
  @Auth(AuthType.Bearer)
  @HttpCode(HttpStatus.OK)
  removeFromCart(
    @ActiveUser() user: IActiveUser,
    @Body()
    body: RemoveFromCartDto,
  ) {
    return this.cartService.removeFromCart(user, body);
  }

  @Delete('clear')
  @UseGuards(IdentityGuard)
  @HttpCode(HttpStatus.OK)
  clearCart(@ActiveUser() user: UserIdentity) {
    return this.cartService.clearCart(user);
  }
}
