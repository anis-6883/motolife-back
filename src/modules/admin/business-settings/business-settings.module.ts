import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessSettingsController } from './business-settings.controller';
import { BusinessSettingsService } from './business-settings.service';
import {
  BusinessSettings,
  BusinessSettingsSchema,
} from '../../../common/models/business-settings.schema';
import { RoleModule } from '../role/role.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [BusinessSettingsController],
  providers: [BusinessSettingsService],
  exports: [BusinessSettingsService],
  imports: [
    RoleModule,
    CommonModule,
    MongooseModule.forFeature([
      {
        name: BusinessSettings.name,
        schema: BusinessSettingsSchema,
      },
    ]),
  ],
})
export class BusinessSettingsModule {}
