import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  UseGuards,
  Query,
  Put,
} from '@nestjs/common';
import { CreateStockUnitDto } from './dto/create-stock-unit.dto';
import { UpdateStockUnitDto } from './dto/update-stock-units.dto';
import { StockUnitService } from './stock-units.service';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { GetStockUnitsQueryDto } from './dto/get-stock-units';
import { PERMISSIONS } from '../role/constants/permissions.constants';

@Controller()
@UseGuards(PermissionsGuard)
export class StockUnitController {
  constructor(private readonly stockUnitService: StockUnitService) {}

  @Post('/damage/:productId')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('productId') productId: string,
    @Body() createStockUnitDtos: CreateStockUnitDto[],
  ) {
    return this.stockUnitService.createDamageUnits(
      productId,
      createStockUnitDtos,
    );
  }

  @Get()
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  findAll(@Query() query: GetStockUnitsQueryDto) {
    return this.stockUnitService.findAll(query);
  }

  @Get('/dropdown')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  getDropdown(@Query() query: GetStockUnitsQueryDto) {
    return this.stockUnitService.getDropdown(query);
  }

  @Put('bulk')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  updateMany(@Body() updates: UpdateStockUnitDto[]) {
    return this.stockUnitService.updateMany(updates);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  findById(@Param('id') id: string) {
    return this.stockUnitService.findById(id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  update(
    @Param('id') id: string,
    @Body() updateStockUnitDto: UpdateStockUnitDto,
  ) {
    return this.stockUnitService.update(id, updateStockUnitDto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PRODUCT_MANAGEMENT)
  remove(@Param('id') id: string) {
    return this.stockUnitService.deleteStockUnit(id);
  }
}
