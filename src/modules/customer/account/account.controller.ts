import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { AccountService } from './account.service';
import {
  AddressDto,
  BankPaymentDto,
  BkashPaymentDto,
  CreateCustomerDto,
} from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import type { IActiveUser } from '../auth/interfaces/active-user.interface';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from 'src/common/enums/auth-type.enum';

@Controller()
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth(AuthType.None)
  create(@Body() createUserDto: CreateCustomerDto) {
    return this.accountService.create(createUserDto);
  }

  @Put()
  @Auth(AuthType.Bearer)
  update(
    @ActiveUser() user: IActiveUser,
    @Body() updateUserDto: UpdateCustomerDto,
  ) {
    return this.accountService.update(user, updateUserDto);
  }

  @Get('payment-methods')
  getPaymentMethods(@ActiveUser() user: IActiveUser) {
    return this.accountService.getPaymentMethods(user);
  }

  @Post('payment-methods')
  addPaymentMethod(
    @ActiveUser() user: IActiveUser,
    @Body() paymentMethodDto: BkashPaymentDto | BankPaymentDto,
  ) {
    return this.accountService.addPaymentMethod(user, paymentMethodDto);
  }

  @Delete('payment-methods/:paymentMethodId')
  removePaymentMethod(
    @ActiveUser() user: IActiveUser,
    @Param('paymentMethodId') paymentMethodId: string,
  ) {
    return this.accountService.removePaymentMethod(user, paymentMethodId);
  }

  @Put('payment-methods/:paymentMethodId/default')
  setDefaultPaymentMethod(
    @ActiveUser() user: IActiveUser,
    @Param('paymentMethodId') paymentMethodId: string,
  ) {
    return this.accountService.setDefaultPaymentMethod(user, paymentMethodId);
  }

  @Post('address')
  @Auth(AuthType.Bearer)
  createAddress(
    @ActiveUser() user: IActiveUser,
    @Body() addressDto: AddressDto,
  ) {
    return this.accountService.addAddress(user, addressDto);
  }

  @Delete('address/:addressId')
  @Auth(AuthType.Bearer)
  removeAddress(
    @ActiveUser() user: IActiveUser,
    @Param('addressId') addressId: string,
  ) {
    return this.accountService.deleteAddress(user, addressId);
  }

  @Put('address/:addressId')
  @Auth(AuthType.Bearer)
  updateAddress(
    @ActiveUser() user: IActiveUser,
    @Param('addressId') addressId: string,
    @Body() addressDto: UpdateAddressDto,
  ) {
    return this.accountService.updateAddress(user, addressId, addressDto);
  }

  @Get('address')
  @Auth(AuthType.Bearer)
  getAddresses(@ActiveUser() user: IActiveUser) {
    return this.accountService.getAddresses(user);
  }

  @Get(':id')
  @Auth(AuthType.Bearer)
  findById(@Param('id') id: string) {
    return this.accountService.findById(id);
  }

  @Delete(':id')
  @Auth(AuthType.Bearer)
  remove(@Param('id') id: string) {
    return this.accountService.remove(id);
  }
}
