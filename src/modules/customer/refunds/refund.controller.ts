import { Controller, Get, Query } from '@nestjs/common';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from 'src/common/enums/auth-type.enum';
import { RefundQueryDto } from './dto/refund-query.dto';
import { type IActiveUser } from '../auth/interfaces/active-user.interface';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { RefundService } from './refund.service';

@Controller()
@Auth(AuthType.Bearer)
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Get()
  async findAll(
    @ActiveUser() user: IActiveUser,
    @Query() query: RefundQueryDto,
  ) {
    return this.refundService.findAll(user, query);
  }
}
