import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductUpdateRequestsService } from './product-update-requests.service';
import { GetProductUpdateRequestsQueryDto } from './dtos/update-request-query.dto';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { type IActiveUser } from '../auth/interfaces/active-user.interface';

@Controller()
export class ProductUpdateRequestsController {
  constructor(
    private readonly productUpdateRequestsService: ProductUpdateRequestsService,
  ) {}

  @Get()
  findAll(
    @Query() query: GetProductUpdateRequestsQueryDto,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.productUpdateRequestsService.findAll(query, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @ActiveUser() user: IActiveUser) {
    return this.productUpdateRequestsService.findOne(id, user);
  }
}
