import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, type PaginateModel } from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { GetAnnouncementsQueryDto } from './dto/get-announcement-query.dto';
import {
  Announcements,
  SystemType,
} from 'src/common/models/announcement.schema';

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectModel(Announcements.name)
    private readonly announcementModel: PaginateModel<Announcements>,
  ) {}

  async findAll(query: GetAnnouncementsQueryDto) {
    const now = new Date();
    const filters: QueryFilter<Announcements> = {
      softDeleted: false,
      selectedSystem: { $in: [SystemType.CUSTOMER, SystemType.ALL] },
      status: true,
      startDate: { $lte: now },
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: now } },
      ],
    };

    const result = await this.announcementModel
      .find(filters)
      .select('-softDeleted -createdAt');

    return apiResponse({
      data: result,
      message: 'Announcements fetched successfully',
    });
  }

  public async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    const announcement = await this.announcementModel
      .findById(id)
      .select('-softDeleted -createdAt');

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }
    return apiResponse({
      data: announcement,
      message: 'Announcement fetched successfully',
    });
  }
}
