import { Module } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { AnnouncementController } from './announcement.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from 'src/common/common.module';
import {
  Announcements,
  AnnouncementsSchema,
} from 'src/common/models/announcement.schema';

@Module({
  controllers: [AnnouncementController],
  providers: [AnnouncementService],
  exports: [AnnouncementService],
  imports: [
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Announcements.name,
        schema: AnnouncementsSchema,
      },
    ]),
  ],
})
export class AnnouncementModule {}
