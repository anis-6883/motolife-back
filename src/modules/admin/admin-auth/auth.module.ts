import { forwardRef, Module } from '@nestjs/common';
import { AdminAuthService } from './auth.service';
import { GenerateTokenProvider } from './providers/generate-token.provider';
import { HashingProvider } from './providers/hashing.provider';
import { BcryptProvider } from './providers/bcrypt.provider';
import { AuthController } from './auth.controller';
import { AdminUserModule } from 'src/modules/admin/admin-user/admin-user.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AdminUser,
  AdminUserSchema,
} from '../../../common/models/admin-users.schema';
import { RoleModule } from '../role/role.module';
import { AccessTokenGuard } from 'src/common/guards/access-token.guard';

@Module({
  providers: [
    AccessTokenGuard,
    AdminAuthService,
    GenerateTokenProvider,
    {
      provide: HashingProvider,
      useClass: BcryptProvider,
    },
  ],
  imports: [RoleModule, forwardRef(() => AdminUserModule)],
  controllers: [AuthController],
  exports: [AdminAuthService, HashingProvider],
})
export class AuthModule {}
