import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SellerAccountService } from './seller-account.service';
import {
  BankPaymentDto,
  BkashPaymentDto,
  CreateSellerDto,
} from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { AuthenticationGuard } from 'src/common/guards/authentication.guard';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from 'src/common/enums/auth-type.enum';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { type IActiveUser } from '../auth/interfaces/active-user.interface';

@Controller()
export class SellerAccountController {
  constructor(private readonly accountService: SellerAccountService) {}

  @Post()
  @Auth(AuthType.None)
  create(@Body() createUserDto: CreateSellerDto) {
    return this.accountService.create(createUserDto);
  }

  @Get('stats')
  @UseGuards(AuthenticationGuard)
  getStats(@ActiveUser() user: IActiveUser) {
    return this.accountService.getStats(user);
  }

  @Get(':id')
  @UseGuards(AuthenticationGuard)
  findById(@Param('id') id: string) {
    return this.accountService.findById(id);
  }

  @Patch()
  @UseGuards(AuthenticationGuard)
  update(
    @ActiveUser() user: IActiveUser,
    @Body() updateUserDto: UpdateSellerDto,
  ) {
    return this.accountService.update(user, updateUserDto);
  }

  @Post(':id/payment-methods')
  @UseGuards(AuthenticationGuard)
  addPaymentMethod(
    @Param('id') id: string,
    @Body() paymentMethodDto: BkashPaymentDto | BankPaymentDto,
  ) {
    return this.accountService.addPaymentMethod(id, paymentMethodDto);
  }

  @Delete(':id/payment-methods/:paymentMethodId')
  @UseGuards(AuthenticationGuard)
  removePaymentMethod(
    @Param('id') id: string,
    @Param('paymentMethodId') paymentMethodId: string,
  ) {
    return this.accountService.removePaymentMethod(id, paymentMethodId);
  }

  @Patch(':id/payment-methods/:paymentMethodId/default')
  @UseGuards(AuthenticationGuard)
  setDefaultPaymentMethod(
    @Param('id') id: string,
    @Param('paymentMethodId') paymentMethodId: string,
  ) {
    return this.accountService.setDefaultPaymentMethod(id, paymentMethodId);
  }

  @Delete(':id')
  @UseGuards(AuthenticationGuard)
  remove(@Param('id') id: string) {
    return this.accountService.remove(id);
  }
}
