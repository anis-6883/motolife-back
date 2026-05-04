import { Controller, Get, Param, Query } from '@nestjs/common';
import { RefundService } from './refund.service';
import { GetRefundQueryDto } from './dtos/get-refund-query.dto';

@Controller()
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Get()
  findAll(@Query() query: GetRefundQueryDto) {
    return this.refundService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.refundService.findById(id);
  }
}
