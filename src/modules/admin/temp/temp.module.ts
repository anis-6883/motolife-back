import { Module } from '@nestjs/common';
import { TempService } from './temp.service';
import { TempController } from './temp.controller';
import { RoleModule } from '../role/role.module';

@Module({
  controllers: [TempController],
  providers: [TempService],
  exports: [TempService],
  imports: [RoleModule],
})
export class TempModule {}
