import { Controller, Get, Param, Delete, Query } from '@nestjs/common';
import { RestockRequestService } from './restock-request.service';
import { GetRestockRequestsQueryDto } from './dtos/get-request-restock-query.dto';
import { type IActiveUser } from '../auth/interfaces/active-user.interface';
import { ActiveUser } from '../auth/decorators/active-user.decorator';

@Controller()
export class RestockRequestController {
  constructor(private readonly productService: RestockRequestService) {}

  @Get()
  findAll(
    @Query() query: GetRestockRequestsQueryDto,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.productService.findAll(query, user);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
