import { forwardRef, Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from '../../../common/models/role.schema';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
  imports: [
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Role.name,
        schema: RoleSchema,
      },
    ]),
  ],
})
export class RoleModule {}
