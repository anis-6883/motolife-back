import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateHeroBannerDto } from './dto/create-hero-banner.dto';
import { UpdateHeroBannerDto } from './dto/update-hero-banner.dto';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, type Model } from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { StorageService } from 'src/common/storage/storage.service';
import { HeroBanner } from 'src/common/models/hero-banner.schema';

@Injectable()
export class HeroBannerService {
  constructor(
    @InjectModel(HeroBanner.name)
    private readonly heroBannerModel: Model<HeroBanner>,
    private readonly storageService: StorageService,
  ) {}

  async create(createBannerDto: CreateHeroBannerDto) {
    let imageToDelete: string | null = null;
    try {
      if (createBannerDto.image) {
        imageToDelete = createBannerDto.image;
      }

      await this.heroBannerModel.create(createBannerDto);
      return apiResponse({
        message: 'Hero banner created successfully',
      });
    } catch (error) {
      if (imageToDelete) {
        await this.storageService.deleteFileByUrl(imageToDelete);
      }
      throw error;
    }
  }

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

  async update(id: string, updateBannerDto: UpdateHeroBannerDto) {
    const banner = await this.heroBannerModel.findById(id);

    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    if (updateBannerDto._uploaded && banner.image) {
      await this.storageService.deleteFileByUrl(banner.image);
    }

    await this.heroBannerModel.findByIdAndUpdate(id, updateBannerDto, {
      new: true,
      runValidators: true,
    });

    return apiResponse({
      message: 'Banner updated successfully',
    });
  }

  async remove(id: string) {
    const deletedBanner = await this.heroBannerModel.findByIdAndUpdate(
      id,
      { softDeleted: true },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!deletedBanner) {
      throw new NotFoundException('Banner not found');
    }

    if (deletedBanner.image) {
      await this.storageService.deleteFileByUrl(deletedBanner.image);
    }

    return apiResponse({
      status: true,
      message: 'Banner deleted successfully',
    });
  }
}
