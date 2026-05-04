import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SellerService } from './sellers.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { Auth } from '../admin-auth/decorators/auth.decorator';
import { AuthType } from '../../../common/enums/auth-type.enum';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { GetAllSellersQueryDto } from './dto/get-all-sellers-query.dto';
import { SellerOrdersQueryDto } from './dto/seller-order-query.dto';
import { GetProductsQueryDto } from 'src/common/dtos/products/get-products-query.dto';
import { GetComboProductsQueryDto } from 'src/common/dtos/combo-products/get-combo-products-query.dto';
import {
  UpdateProductDto,
  UpdateVariantDto,
} from 'src/common/dtos/products/update-products.dto';
import { ActiveUser } from '../admin-auth/decorators/active-user.decorator';
import { type IActiveUser } from '../admin-auth/interfaces/active-user.interface';
import { GetSellerWithdrawQueryDto } from './dto/get-seller-withdraw-query.dto';

@Controller()
@UseGuards(PermissionsGuard)
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Post()
  @Auth(AuthType.None)
  create(@Body() createUserDto: CreateSellerDto) {
    return this.sellerService.create(createUserDto);
  }

  @Get()
  //@RequirePermissions(PERMISSIONS.ALL)
  findAll(@Query() query: GetAllSellersQueryDto) {
    return this.sellerService.findAll(query);
  }

  @Get('dropdown')
  //@RequirePermissions(PERMISSIONS.ALL)
  getDropdown(@Query() query: GetAllSellersQueryDto) {
    return this.sellerService.getDropdown(query);
  }

  @Get(':id')
  //@RequirePermissions(PERMISSIONS.ALL)
  findById(@Param('id') id: string) {
    return this.sellerService.findById(id);
  }

  @Get(':id/order-stats')
  //@RequirePermissions(PERMISSIONS.ALL)
  getOrderStats(@Param('id') id: string) {
    return this.sellerService.sellerOrderStats(id);
  }

  @Get(':id/orders')
  //@RequirePermissions(PERMISSIONS.ALL)
  getOrders(@Param('id') id: string, @Query() query: SellerOrdersQueryDto) {
    return this.sellerService.getOrders(id, query);
  }

  @Get(':id/orders/:orderId')
  //@RequirePermissions(PERMISSIONS.ALL)
  getOrderById(@Param('id') id: string, @Param('orderId') orderId: string) {
    return this.sellerService.getSellerOrderById(id, orderId);
  }

  @Patch(':id')
  //@RequirePermissions(PERMISSIONS.ALL)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateSellerDto) {
    return this.sellerService.update(id, updateUserDto);
  }

  @Delete(':id')
  //@RequirePermissions(PERMISSIONS.ALL)
  remove(@Param('id') id: string) {
    return this.sellerService.remove(id);
  }

  @Get(':id/products')
  //@RequirePermissions(PERMISSIONS.ALL)
  getProducts(@Param('id') id: string, @Query() query: GetProductsQueryDto) {
    return this.sellerService.findSellerProducts(id, query);
  }

  @Get(':id/products/:productId')
  //@RequirePermissions(PERMISSIONS.ALL)
  getProductById(
    @Param('id') id: string,
    @Param('productId') productId: string,
  ) {
    return this.sellerService.findSellerProductById(id, productId);
  }

  @Patch(':id/products/:productId')
  //@RequirePermissions(PERMISSIONS.ALL)
  updateProduct(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body() updateProductDto: UpdateProductDto,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.sellerService.updateSellerProduct(
      id,
      productId,
      updateProductDto,
      user,
    );
  }

  @Patch(':id/products/:productId/variant')
  //@RequirePermissions(PERMISSIONS.ALL)
  updateProductVariant(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body() updateVariantDto: UpdateVariantDto,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.sellerService.updateSellerProductVariant(
      id,
      productId,
      updateVariantDto,
      user,
    );
  }

  @Delete(':id/products/:productId')
  //@RequirePermissions(PERMISSIONS.ALL)
  deleteSellerProduct(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.sellerService.removeSellerProduct(id, productId, user);
  }

  @Get(':id/combo-products')
  //@RequirePermissions(PERMISSIONS.ALL)
  getComboProducts(
    @Param('id') id: string,
    @Query() query: GetComboProductsQueryDto,
  ) {
    return this.sellerService.findAllSellerComboProducts(id, query);
  }

  @Get(':id/combo-products/:productId')
  //@RequirePermissions(PERMISSIONS.ALL)
  getComboProductById(
    @Param('id') id: string,
    @Param('productId') productId: string,
  ) {
    return this.sellerService.findSellerComboProductById(id, productId);
  }

  @Delete(':id/combo-products/:productId')
  //@RequirePermissions(PERMISSIONS.ALL)
  deleteSellerComboProduct(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.sellerService.removeSellerComboProduct(id, productId, user);
  }

  @Patch(':id/combo-products/:productId')
  //@RequirePermissions(PERMISSIONS.ALL)
  updateComboProduct(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body() updateProductDto: UpdateProductDto,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.sellerService.updateSellerComboProduct(
      id,
      productId,
      updateProductDto,
      user,
    );
  }

  @Get(':id/withdraws')
  @RequirePermissions(PERMISSIONS.USER_MANAGEMENT)
  getWithdrawList(
    @Param('id') id: string,
    @Query() query: GetSellerWithdrawQueryDto,
  ) {
    return this.sellerService.getWithdrawList(id, query);
  }
}
