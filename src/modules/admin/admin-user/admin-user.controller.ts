import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  Put,
} from '@nestjs/common';
import { AdminUserService } from './admin-user.service';
import { CreateAdminUserDto } from './dto/create-admin.dto';
import { UpdateAdminUserDto } from './dto/update-admin.dto';
import { PermissionsGuard } from '../admin-auth/guards/permissions.guard';
import { RequirePermissions } from '../admin-auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../role/constants/permissions.constants';
import { GetAllUsersQueryDto } from './dto/get-all-users-query.dto';

@Controller()
@UseGuards(PermissionsGuard)
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Post()
  create(@Body() createUserDto: CreateAdminUserDto) {
    return this.adminUserService.create(createUserDto);
  }

  @Get()
  //@RequirePermissions(PERMISSIONS.ALL)
  findAll(@Query() query: GetAllUsersQueryDto) {
    return this.adminUserService.findAll(query);
  }

  @Get('all')
  //@RequirePermissions(PERMISSIONS.ALL)
  findAllWithoutPagination() {
    return this.adminUserService.findAllWithoutPagination();
  }

  @Get(':id')
  //@RequirePermissions(PERMISSIONS.ALL)
  findById(@Param('id') id: string) {
    return this.adminUserService.findById(id);
  }

  @Put(':id')
  //@RequirePermissions(PERMISSIONS.ALL)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateAdminUserDto) {
    return this.adminUserService.update(id, updateUserDto);
  }

  @Delete(':id')
  //@RequirePermissions(PERMISSIONS.ALL)
  remove(@Param('id') id: string) {
    return this.adminUserService.remove(id);
  }
}
