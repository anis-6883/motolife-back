import { Module } from '@nestjs/common';
import { AppreciationService } from './appreciation.service';
import { AppreciationController } from './appreciation.controller';

@Module({
  controllers: [AppreciationController],
  providers: [AppreciationService],
  exports: [AppreciationService],
})
export class AppreciationModule {}
