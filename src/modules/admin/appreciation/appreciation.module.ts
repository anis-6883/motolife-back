import { Module } from '@nestjs/common';
import { AppreciationService } from './appreciation.service';
import { AppreciationController } from './appreciation.controller';
import { RoleModule } from '../role/role.module';

@Module({
  controllers: [AppreciationController],
  providers: [AppreciationService],
  exports: [AppreciationService],
  imports: [RoleModule],
})
export class AppreciationModule {}
