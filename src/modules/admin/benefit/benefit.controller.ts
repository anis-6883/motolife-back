import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  UseGuards,
  Query,
  Put,
} from '@nestjs/common';
import { CreateBenefitsDto } from './dto/create-benefit.dto';
import { UpdateBenefitsDto } from './dto/update-benefit.dto';
import { BenefitsService } from './benefit.service';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { GetBenefitsQueryDto } from './dto/get-benefits-query.dto';

@Controller()
@UseGuards(PermissionsGuard)
export class BenefitsController {
  constructor(private readonly benefitService: BenefitsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createBenefitsDto: CreateBenefitsDto) {
    return this.benefitService.create(createBenefitsDto);
  }

  @Get()
  //@RequirePermissions(PERMISSIONS.PRODUCT)
  findAll(@Query() query: GetBenefitsQueryDto) {
    return this.benefitService.findAll(query);
  }

  @Get(':id')
  // //@RequirePermissions(PERMISSIONS.PRODUCT)
  findById(@Param('id') id: string) {
    return this.benefitService.findById(id);
  }

  @Put(':id')
  //@RequirePermissions(PERMISSIONS.PRODUCT)
  update(
    @Param('id') id: string,
    @Body() updateBenefitsDto: UpdateBenefitsDto,
  ) {
    return this.benefitService.update(id, updateBenefitsDto);
  }

  @Delete(':id')
  //@RequirePermissions(PERMISSIONS.PRODUCT)
  remove(@Param('id') id: string) {
    return this.benefitService.remove(id);
  }

  @Patch(':id/status')
  // //@RequirePermissions(PERMISSIONS.PRODUCT)
  updateStatus(
    @Param('id') id: string,
    @Body() { status }: { status: boolean },
  ) {
    return this.benefitService.updateStatus(id, status);
  }
}
