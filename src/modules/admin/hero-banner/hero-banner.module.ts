import { Module } from '@nestjs/common';
import { HeroBannerService } from './hero-banner.service';
import { HeroBannerController } from './hero-banner.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from 'src/common/common.module';
import { RoleModule } from '../role/role.module';
import {
  HeroBanner,
  HeroBannerSchema,
} from 'src/common/models/hero-banner.schema';

@Module({
  controllers: [HeroBannerController],
  providers: [HeroBannerService],
  exports: [HeroBannerService],
  imports: [
    RoleModule,
    CommonModule,
    MongooseModule.forFeature([
      {
        name: HeroBanner.name,
        schema: HeroBannerSchema,
      },
    ]),
  ],
})
export class HeroBannerModule {}
