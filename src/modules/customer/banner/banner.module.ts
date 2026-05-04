import { Module } from '@nestjs/common';
import { BannerService } from './banner.service';
import { BannerController } from './banner.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Banner, BannerSchema } from '../../../common/models/banner.schema';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [BannerController],
  providers: [BannerService],
  exports: [BannerService],
  imports: [
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Banner.name,
        schema: BannerSchema,
      },
    ]),
  ],
})
export class BannerModule {}
