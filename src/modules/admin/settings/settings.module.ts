import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import {
  Settings,
  SettingsSchema,
} from '../../../common/models/settings.schema';
import { RoleModule } from '../role/role.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
  imports: [
    RoleModule,
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Settings.name,
        schema: SettingsSchema,
      },
    ]),
  ],
})
export class SettingsModule {}
