import { Module } from '@nestjs/common';
import { LandingSectionService } from './landing-section.service';
import { LandingSectionController } from './landing-section.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  LandingSection,
  LandingSectionSchema,
} from 'src/common/models/landing-sections.schema';
import { CommonModule } from 'src/common/common.module';
import { RoleModule } from '../role/role.module';

@Module({
  controllers: [LandingSectionController],
  providers: [LandingSectionService],
  exports: [LandingSectionService],
  imports: [
    RoleModule,
    CommonModule,
    MongooseModule.forFeature([
      {
        name: LandingSection.name,
        schema: LandingSectionSchema,
      },
    ]),
  ],
})
export class LandingSectionModule {}
