import { Controller, Get, Param, Query } from '@nestjs/common';
import { BrandService } from './brand.service';
import { GetBrandsQueryDto } from './dto/get-brands-query.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from 'src/common/enums/auth-type.enum';

@Controller()
@Auth(AuthType.None)
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Get()
  findAll(@Query() query: GetBrandsQueryDto) {
    return this.brandService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.brandService.findById(id);
  }
}
