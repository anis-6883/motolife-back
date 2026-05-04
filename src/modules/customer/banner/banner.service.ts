import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, type PaginateModel } from 'mongoose';
import { Banner } from '../../../common/models/banner.schema';
import { apiResponse } from 'src/common/utils/api-response';
import { GetBannersQueryDto } from './dto/get-banner-query.dto';

@Injectable()
export class BannerService {
  constructor(
    @InjectModel(Banner.name)
    private readonly bannerModel: PaginateModel<Banner>,
  ) {}

  async findAll(query: GetBannersQueryDto) {
    const { type } = query;

    const filters: QueryFilter<Banner> = { softDeleted: false, status: true };

    if (type) {
      filters.type = type;
    }

    const result = await this.bannerModel
      .find(filters)
      .select('-softDeleted -updatedAt -createdAt');

    return apiResponse({
      data: result,
      message: 'Banners fetched successfully',
    });
  }

  public async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    const banner = await this.bannerModel
      .findById(id)
      .select('-softDeleted -updatedAt -createdAt');

    if (!banner) {
      throw new NotFoundException('Banner not found');
    }
    return apiResponse({
      data: banner,
      message: 'Banner fetched successfully',
    });
  }
}
