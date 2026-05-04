import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OthersController } from './others.controller';
import { OthersService } from './others.service';
import { Settings, SettingsSchema } from 'src/common/models/settings.schema';

@Module({
  controllers: [OthersController],
  providers: [OthersService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Settings.name,
        schema: SettingsSchema,
      },
    ]),
  ],
})
export class OthersModule {}
