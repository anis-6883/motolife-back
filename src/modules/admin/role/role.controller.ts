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
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleService } from './role.service';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from './constants/permissions.constants';
import { GetRolesQueryDto } from './dto/get-role-query.dto';

@Controller()
@UseGuards(PermissionsGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(PERMISSIONS.USER_ROLE_SETUP)
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.USER_ROLE_SETUP, PERMISSIONS.ALL)
  findAll(@Query() query: GetRolesQueryDto) {
    return this.roleService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.USER_ROLE_SETUP)
  findById(@Param('id') id: string) {
    return this.roleService.findById(id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.USER_ROLE_SETUP)
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.USER_ROLE_SETUP)
  remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }

  @Patch(':id/status')
  @RequirePermissions(PERMISSIONS.USER_ROLE_SETUP)
  updateStatus(
    @Param('id') id: string,
    @Body() statusData: { status: boolean },
  ) {
    return this.roleService.updateStatus(id, statusData);
  }
}
