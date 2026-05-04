import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  PipelineStage,
  QueryFilter,
  type AggregatePaginateModel,
  type PaginateModel,
} from 'mongoose';
import { Banner } from '../../../common/models/banner.schema';
import { apiResponse } from 'src/common/utils/api-response';
import { GetBannersQueryDto } from './dto/get-banner-query.dto';
import { Product } from 'src/common/models/products.schema';
import { Category } from 'src/common/models/category.schema';
import { ComboProduct } from 'src/common/models/combo-products.schema';
import { Seller } from 'src/common/models/seller.schema';
import { StorageService } from 'src/common/storage/storage.service';

@Injectable()
export class BannerService {
  constructor(
    @InjectModel(Banner.name)
    private readonly bannerModel: AggregatePaginateModel<Banner>,
    @InjectModel(Product.name)
    private readonly productModel: PaginateModel<Product>,
    @InjectModel(Category.name)
    private readonly categoryModel: PaginateModel<Category>,
    @InjectModel(ComboProduct.name)
    private readonly comboProductModel: PaginateModel<ComboProduct>,
    @InjectModel(Seller.name)
    private readonly sellerModel: PaginateModel<Seller>,
    private readonly storageService: StorageService,
  ) {}

  async create(createBannerDto: CreateBannerDto) {
    // const bannerExists = await this.bannerModel.findOne({
    //   type: createBannerDto.type,
    //   softDeleted: false,
    // });
    // if (bannerExists) {
    //   throw new BadRequestException('Banner already exists');
    // }

    if (createBannerDto.productId) {
      const productExists = await this.productModel.findById(
        createBannerDto.productId,
      );
      if (!productExists) {
        throw new NotFoundException('Product not found');
      }
    }

    if (createBannerDto.categoryId) {
      const categoryExists = await this.categoryModel.findById(
        createBannerDto.categoryId,
      );
      if (!categoryExists) {
        throw new NotFoundException('Category not found');
      }
    }

    if (createBannerDto.comboProductId) {
      const comboProductExists = await this.comboProductModel.findById(
        createBannerDto.comboProductId,
      );
      if (!comboProductExists) {
        throw new NotFoundException('Combo product not found');
      }
    }

    if (createBannerDto.sellerId) {
      const sellerExists = await this.sellerModel.findById(
        createBannerDto.sellerId,
      );
      if (!sellerExists) {
        throw new NotFoundException('Seller not found');
      }
    }

    await this.bannerModel.create(createBannerDto);
    return apiResponse({
      message: 'Banner created successfully',
    });
  }

  async findAll(query: GetBannersQueryDto) {
    const { page = 1, limit = 10, search } = query;

    const filters: QueryFilter<Banner> = { softDeleted: false };

    if (search) {
      filters.title = { $regex: search, $options: 'i' };
    }

    const aggregate = this.bannerModel.aggregate([
      {
        $match: filters,
      },
      {
        $lookup: {
          from: 'products',
          foreignField: '_id',
          localField: 'productId',
          as: 'product',
          pipeline: [
            {
              $project: {
                name: 1,
                thumbnail: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$product',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'categories',
          foreignField: '_id',
          localField: 'categoryId',
          as: 'category',
          pipeline: [
            {
              $project: {
                name: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'combo_products',
          foreignField: '_id',
          localField: 'comboProductId',
          as: 'comboProduct',
          pipeline: [
            {
              $project: {
                name: 1,
                thumbnail: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$comboProduct',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'sellers',
          foreignField: '_id',
          localField: 'sellerId',
          as: 'seller',
          pipeline: [
            {
              $project: {
                name: 1,
                thumbnail: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$seller',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          productId: 0,
          softDeleted: 0,
          categoryId: 0,
          sellerId: 0,
          comboProductId: 0,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    const result = await this.bannerModel.aggregatePaginate(aggregate, {
      page,
      limit: limit > 50 ? 50 : limit,
    });

    const { docs, ...rest } = result;

    return apiResponse({
      data: { docs, pagination: rest },
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

  async update(id: string, updateBannerDto: UpdateBannerDto) {
    const banner = await this.bannerModel.findById(id);

    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    if (updateBannerDto._uploaded && banner.image) {
      await this.storageService.deleteFileByUrl(banner.image);
    }

    const updatedBanner = await this.bannerModel.findByIdAndUpdate(
      id,
      updateBannerDto,
      {
        new: true,
        runValidators: true,
      },
    );

    return apiResponse({
      data: updatedBanner,
      message: 'Banner updated successfully',
    });
  }

  async remove(id: string) {
    const deletedBanner = await this.bannerModel.findByIdAndUpdate(
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
