import {
  Controller,
  Get,
  Param,
  Query,
  Body,
  Patch,
  Post,
  HttpStatus,
  HttpCode,
  Delete,
} from '@nestjs/common';
import { WithdrawService } from './withdraw.service';
import { GetWithdrawQueryDto } from './dtos/get-withdraw-query.dto';
import { UpdateWithdrawDto } from './dtos/update-withdraw.dto';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import type { IActiveUser } from '../auth/interfaces/active-user.interface';
import { CreateWithdrawDto } from './dtos/create-withdraw.dto';

@Controller()
export class WithdrawController {
  constructor(private readonly withdrawService: WithdrawService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateWithdrawDto, @ActiveUser() user: IActiveUser) {
    return this.withdrawService.create(dto, user);
  }

  @Get()
  findAll(
    @Query() query: GetWithdrawQueryDto,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.withdrawService.findAll(query, user);
  }

  @Get('stats')
  getWithdrawStats(@ActiveUser() user: IActiveUser) {
    return this.withdrawService.getWithdrawStats(user);
  }

  @Get(':id')
  findById(@Param('id') id: string, @ActiveUser() user: IActiveUser) {
    return this.withdrawService.findById(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWithdrawDto,
    @ActiveUser() user: IActiveUser,
  ) {
    return this.withdrawService.update(id, dto, user);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @ActiveUser() user: IActiveUser) {
    return this.withdrawService.delete(id, user);
  }
}
