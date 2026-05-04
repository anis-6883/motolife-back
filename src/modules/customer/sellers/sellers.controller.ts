import { Controller, Get, Param, Query } from '@nestjs/common';
import { GetAllSellersQueryDto } from './dto/get-all-sellers-query.dto';
import { SellersService } from './sellers.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from 'src/common/enums/auth-type.enum';

@Controller()
@Auth(AuthType.None)
export class SellersController {
  constructor(private readonly sellerService: SellersService) {}

  @Get()
  findAll(@Query() query: GetAllSellersQueryDto) {
    return this.sellerService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.sellerService.findById(id);
  }
}
