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
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { AttributeService } from './attribute.service';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { GetAttributesQueryDto } from './dto/get-attribute-query.dto';

@Controller()
@UseGuards(PermissionsGuard)
export class AttributeController {
  constructor(private readonly attributeService: AttributeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createAttributeDto: CreateAttributeDto) {
    return this.attributeService.create(createAttributeDto);
  }

  @Get()
  //@RequirePermissions(PERMISSIONS.PRODUCT)
  findAll(@Query() query: GetAttributesQueryDto) {
    return this.attributeService.findAll(query);
  }

  @Get(':id')
  //@RequirePermissions(PERMISSIONS.PRODUCT)
  findById(@Param('id') id: string) {
    return this.attributeService.findById(id);
  }

  @Put(':id')
  // //@RequirePermissions(PERMISSIONS.PRODUCT)
  update(
    @Param('id') id: string,
    @Body() updateAttributeDto: UpdateAttributeDto,
  ) {
    return this.attributeService.update(id, updateAttributeDto);
  }

  @Delete(':id')
  //@RequirePermissions(PERMISSIONS.PRODUCT)
  remove(@Param('id') id: string) {
    return this.attributeService.remove(id);
  }

  @Patch(':id/status')
  // //@RequirePermissions(PERMISSIONS.PRODUCT)
  updateStatus(
    @Param('id') id: string,
    @Body() { status }: { status: boolean },
  ) {
    return this.attributeService.updateStatus(id, status);
  }
}
