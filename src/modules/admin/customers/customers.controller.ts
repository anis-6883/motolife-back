import {
  Controller,
  Get,
  Param,
  UseGuards,
  Query,
  Patch,
  Delete,
  Body,
} from '@nestjs/common';
import { CustomerService } from './customers.service';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { GetAllCustomersQueryDto } from './dto/get-all-customers-query.dto';
import { CustomerOrdersQueryDto } from './dto/customer-order-query.dto';
import { UpdateCustomerDto } from 'src/modules/customer/account/dto/update-customer.dto';

@Controller()
@UseGuards(PermissionsGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.USER_MANAGEMENT)
  findAll(@Query() query: GetAllCustomersQueryDto) {
    return this.customerService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.USER_MANAGEMENT)
  findById(@Param('id') id: string) {
    return this.customerService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.USER_MANAGEMENT)
  updateCustomer(
    @Param('id') id: string,
    @Body() updateDto: UpdateCustomerDto,
  ) {
    return this.customerService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.USER_MANAGEMENT)
  deleteCustomer(@Param('id') id: string) {
    return this.customerService.delete(id);
  }

  @Get(':id/orders')
  @RequirePermissions(PERMISSIONS.USER_MANAGEMENT)
  getOrders(@Param('id') id: string, @Query() query: CustomerOrdersQueryDto) {
    return this.customerService.getOrders(id, query);
  }

  @Get(':id/orders/:orderId')
  @RequirePermissions(PERMISSIONS.USER_MANAGEMENT)
  getOrderById(@Param('id') id: string, @Param('orderId') orderId: string) {
    return this.customerService.getCustomerOrderById(id, orderId);
  }
}
