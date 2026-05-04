import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, type PaginateModel } from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { GetAnnouncementsQueryDto } from './dto/get-announcement-query.dto';
import { Announcements } from 'src/common/models/announcement.schema';

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectModel(Announcements.name)
    private readonly announcementModel: PaginateModel<Announcements>,
  ) {}

  async create(createAnnouncementDto: CreateAnnouncementDto) {
    await this.announcementModel.create(createAnnouncementDto);
    return apiResponse({
      message: 'Announcement created successfully',
    });
  }

  async findAll(query: GetAnnouncementsQueryDto) {
    const { page = 1, limit = 10, search } = query;

    const filters: QueryFilter<Announcements> = { softDeleted: false };

    if (search) {
      filters.title = { $regex: search, $options: 'i' };
    }

    const result = await this.announcementModel.paginate(filters, {
      page,
      limit,
    });
    const { docs, ...rest } = result;

    return apiResponse({
      data: { docs, pagination: rest },
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

  async update(id: string, updateAnnouncementDto: UpdateAnnouncementDto) {
    const announcement = await this.announcementModel.findById(id);

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }
    const updatedAnnouncement = await this.announcementModel.findByIdAndUpdate(
      id,
      updateAnnouncementDto,
      {
        new: true,
        runValidators: true,
      },
    );

    return apiResponse({
      data: updatedAnnouncement,
      message: 'Announcement updated successfully',
    });
  }

  async remove(id: string) {
    const deletedAnnouncement = await this.announcementModel.findByIdAndUpdate(
      id,
      { softDeleted: true },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!deletedAnnouncement) {
      throw new NotFoundException('Announcement not found');
    }

    return apiResponse({
      status: true,
      message: 'Announcement deleted successfully',
    });
  }
}
