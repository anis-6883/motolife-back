import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Post,
} from '@nestjs/common';
import { ReplyDto, UpdateDisputeDto } from './dto/update-dispute.dto';
import { DisputeService } from './dispute.service';
import { GetDisputeQueryDto } from './dto/get-dispute-query.dto';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { type IActiveUser } from '../auth/interfaces/active-user.interface';
import { CreateDisputeDto } from './dto/create-dispute.dto';

@Controller()
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post()
  createDispute(
    @ActiveUser() user: IActiveUser,
    @Body() createDisputeDto: CreateDisputeDto,
  ) {
    return this.disputeService.createDispute(user, createDisputeDto);
  }

  @Get()
  findAll(@ActiveUser() user: IActiveUser, @Query() query: GetDisputeQueryDto) {
    return this.disputeService.findAll(user, query);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDisputeDto: UpdateDisputeDto) {
    return this.disputeService.update(id, updateDisputeDto);
  }

  @Patch(':id/reply')
  addReply(@Param('id') id: string, @Body() replyDto: ReplyDto) {
    return this.disputeService.addReply(id, replyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.disputeService.remove(id);
  }
}
