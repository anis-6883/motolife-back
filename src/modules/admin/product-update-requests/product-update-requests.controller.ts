import { Controller, Get, Patch, Param, Query, Body } from '@nestjs/common';
import { ProductUpdateRequestsService } from './product-update-requests.service';
import { UpdateRequestDto } from './dtos/update-request-dto';
import { ActiveUser } from '../admin-auth/decorators/active-user.decorator';
import { type IActiveUser } from '../admin-auth/interfaces/active-user.interface';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';

@Controller()
export class ProductUpdateRequestsController {
  constructor(
    private readonly productUpdateRequestsService: ProductUpdateRequestsService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  findAll(@Query() query: any) {
    return this.productUpdateRequestsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  findOne(@Param('id') id: string) {
    return this.productUpdateRequestsService.findOne(id);
  }

  @Patch(':id/approve')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  approve(@Param('id') id: string, @ActiveUser() user: IActiveUser) {
    return this.productUpdateRequestsService.approve(id, user);
  }

  @Patch(':id/reject')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  reject(
    @Param('id') id: string,
    @Body() requestDto: UpdateRequestDto,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.productUpdateRequestsService.reject(id, requestDto, user);
  }
}
