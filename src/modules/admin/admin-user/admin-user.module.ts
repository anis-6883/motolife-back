import { forwardRef, Module } from '@nestjs/common';
import { AdminUserService } from './admin-user.service';
import { AdminUserController } from './admin-user.controller';
import { CreateAdminUserProvider } from './providers/create-admin-user.provider';
import { AuthModule } from 'src/modules/admin/admin-auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AdminUser,
  AdminUserSchema,
} from '../../../common/models/admin-users.schema';
import { RoleModule } from '../role/role.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [AdminUserController],
  providers: [AdminUserService, CreateAdminUserProvider],
  exports: [AdminUserService],
  imports: [
    RoleModule,
    forwardRef(() => AuthModule),
    CommonModule,
    MongooseModule.forFeature([
      {
        name: AdminUser.name,
        schema: AdminUserSchema,
      },
    ]),
  ],
})
export class AdminUserModule {}
