import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ReplyDto, UpdateDisputeDto } from './dto/update-dispute.dto';
import { DisputeService } from './dispute.service';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { GetDisputeQueryDto } from './dto/get-dispute-query.dto';

@Controller()
@UseGuards(PermissionsGuard)
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  findAll(@Query() query: GetDisputeQueryDto) {
    return this.disputeService.findAll(query);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  update(@Param('id') id: string, @Body() updateDisputeDto: UpdateDisputeDto) {
    return this.disputeService.update(id, updateDisputeDto);
  }

  @Patch(':id/reply')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  addReply(@Param('id') id: string, @Body() replyDto: ReplyDto) {
    return this.disputeService.addReply(id, replyDto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  remove(@Param('id') id: string) {
    return this.disputeService.remove(id);
  }
}
