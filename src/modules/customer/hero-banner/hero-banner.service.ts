import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, type Model } from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { HeroBanner } from 'src/common/models/hero-banner.schema';

@Injectable()
export class HeroBannerService {
  constructor(
    @InjectModel(HeroBanner.name)
    private readonly heroBannerModel: Model<HeroBanner>,
  ) {}

  async findAll() {
    const filters: QueryFilter<HeroBanner> = { softDeleted: false };

    const result = await this.heroBannerModel
      .find(filters)
      .select('-softDeleted -updatedAt -createdAt');

    return apiResponse({
      data: result,
      message: 'Hero banners fetched successfully',
    });
  }

  public async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    const banner = await this.heroBannerModel
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
