import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Model,
  PipelineStage,
  QueryFilter,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { ComboProduct } from 'src/common/models/combo-products.schema';
import { CreateComboProductDto } from 'src/common/dtos/combo-products/create-combo-products.dto';
import { GetComboProductsQueryDto } from 'src/common/dtos/combo-products/get-combo-products-query.dto';
import { UpdateComboProductDto } from 'src/common/dtos/combo-products/update-combo-products.dto';
import { IActiveUser } from '../admin-auth/interfaces/active-user.interface';
import { PRODUCT_STATUS } from 'src/common/enums/products.enum';
import { Seller } from 'src/common/models/seller.schema';
import { ShopType } from 'src/common/enums/seller.enums';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction, ResourceType } from 'src/common/enums/admin.enum';
import { Temp } from 'src/common/models/temp.schema';
import { StorageService } from 'src/common/storage/storage.service';
import { ComboBanner } from 'src/common/models/combo-banner';
import { CreateComboBannerDto } from './dto/create-combo-banner.dto';

@Injectable()
export class ComboProductService {
  constructor(
    @InjectModel(ComboProduct.name)
    private readonly productModel: AggregatePaginateModel<ComboProduct>,
    @InjectModel(Seller.name)
    private readonly sellerModel: AggregatePaginateModel<Seller>,
    @InjectModel(Temp.name)
    private readonly tempModel: Model<Temp>,
    @InjectModel(ComboBanner.name)
    private readonly comboBannerModel: Model<ComboBanner>,
    private readonly activityService: ActivityService,
    private readonly storageService: StorageService,
  ) {}

  async create(
    createComboProductDto: CreateComboProductDto,
    user: IActiveUser,
  ) {
    const imagesToCleanup: string[] = [];
    if (createComboProductDto.thumbnail)
      imagesToCleanup.push(createComboProductDto.thumbnail);

    if (createComboProductDto.images) {
      createComboProductDto.images.forEach((img) => {
        if (img) imagesToCleanup.push(img);
      });
    }

    const session = await this.productModel.db.startSession();
    session.startTransaction();

    try {
      const inhouseSeller = await this.sellerModel
        .findOne({
          shopType: ShopType.INHOUSE,
        })
        .session(session);

      if (!inhouseSeller) {
        throw new NotFoundException('Inhouse seller not found');
      }

      const productExistsWithSlugOrSku = await this.productModel.findOne({
        $or: [
          { slug: createComboProductDto.slug },
          { sku: createComboProductDto.sku },
        ],
      });

      if (productExistsWithSlugOrSku) {
        createComboProductDto.slug = `${createComboProductDto.slug}-${String(Date.now()).slice(-4)}`;
        createComboProductDto.sku = `${createComboProductDto.sku}-${String(Date.now()).slice(-4)}`;
      }

      const [comboProduct] = await this.productModel.create(
        [
          {
            ...createComboProductDto,
            seller: inhouseSeller._id,
            status: PRODUCT_STATUS.APPROVED,
          },
        ],
        { session },
      );

      // await this.tempModel.deleteMany(
      //   { url: { $in: imagesToCleanup } },
      //   { session },
      // );

      await this.activityService.createActivity(
        {
          title: 'Combo Product Added',
          action: ActivityAction.CREATE,
          resourceType: ResourceType.COMBO_PRODUCT,
          resourceId: comboProduct._id,
          user: new Types.ObjectId(user.sub),
          payload: comboProduct,
        },
        session,
      );

      await session.commitTransaction();
      return apiResponse({
        data: comboProduct,
        message: 'Combo product created successfully',
      });
    } catch (error) {
      await session.abortTransaction();

      if (imagesToCleanup.length > 0) {
        await Promise.all(
          imagesToCleanup.map((url) =>
            this.storageService.deleteFileByUrl(url),
          ),
        ).catch((s3Err) => console.error('S3 Cleanup Failed:', s3Err));
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async findAll(query: GetComboProductsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      date,
      seller,
      isPublished,
    } = query;

    const filters: QueryFilter<ComboProduct> = {
      softDeleted: false,
    };

    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { productId: { $regex: search, $options: 'i' } },
      ];
    }

    if (seller) {
      filters.seller = new Types.ObjectId(seller);
    }

    if (isPublished) {
      filters.isPublished = isPublished === 'true';
    }

    if (date) {
      if (date === 'today') {
        filters.createdAt = {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        };
      } else if (date === 'week') {
        filters.createdAt = {
          $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        };
      } else if (date === 'month') {
        filters.createdAt = {
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        };
      }
    }

    const pipeline: PipelineStage[] = [
      {
        $match: filters,
      },
      {
        $sort: { [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1 },
      },
      {
        $lookup: {
          from: 'sellers',
          localField: 'seller',
          foreignField: '_id',
          as: 'seller',
          pipeline: [
            {
              $project: {
                fullName: 1,
                phone: 1,
                email: 1,
                'store.storeName': 1,
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
    ];

    const result = await this.productModel.aggregatePaginate(pipeline, {
      page,
      limit: limit > 50 ? 50 : limit,
    });
    const { docs, ...rest } = result;

    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Combo products fetched successfully',
    });
  }

  async getDropdown(query: GetComboProductsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      date,
      seller,
    } = query;

    const filters: QueryFilter<ComboProduct> = {
      softDeleted: false,
      status: PRODUCT_STATUS.APPROVED,
      isPublished: true,
    };

    if (search) {
      filters.name = { $regex: search, $options: 'i' };
    }

    if (seller) {
      filters.seller = new Types.ObjectId(seller);
    }

    if (date) {
      if (date === 'today') {
        filters.createdAt = {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        };
      } else if (date === 'week') {
        filters.createdAt = {
          $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        };
      } else if (date === 'month') {
        filters.createdAt = {
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        };
      }
    }

    const pipeline: PipelineStage[] = [
      {
        $match: filters,
      },
      {
        $project: {
          name: 1,
          thumbnail: 1,
        },
      },
      {
        $sort: { [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1 },
      },
    ];

    const result = await this.productModel.aggregatePaginate(pipeline, {
      page,
      limit: limit > 50 ? 50 : limit,
    });
    const { docs, ...rest } = result;

    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Combo products fetched successfully',
    });
  }

  async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    const [product] = await this.productModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(id) },
      },
      {
        $lookup: {
          from: 'sellers',
          localField: 'seller',
          foreignField: '_id',
          as: 'seller',
          pipeline: [
            {
              $project: {
                fullName: 1,
                image: 1,
                phone: 1,
                'store.storeName': 1,
                'store.address': 1,
                'store.logoImage': 1,
                totalProducts: 1,
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
    ]);
    if (!product) {
      throw new NotFoundException('Combo product not found');
    }
    return apiResponse({
      data: product,
      message: 'Combo product fetched successfully',
    });
  }

  async update(
    id: string,
    updateComboProductDto: UpdateComboProductDto,
    user: IActiveUser,
  ) {
    const updateData: UpdateComboProductDto = { ...updateComboProductDto };

    if (updateData.sizeGuide) {
      for (const key in updateData.sizeGuide) {
        updateData[`sizeGuide.${key}`] = updateData.sizeGuide[key];
      }
      delete updateData.sizeGuide;
    }

    const updatedComboProduct = await this.productModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (!updatedComboProduct) {
      throw new NotFoundException(`Combo product with ID ${id} not found`);
    }

    await this.activityService.createActivity({
      title: 'Combo Product Updated',
      action: ActivityAction.UPDATE,
      resourceType: ResourceType.COMBO_PRODUCT,
      resourceId: updatedComboProduct._id,
      user: new Types.ObjectId(user.sub),
      payload: updatedComboProduct,
    });

    return apiResponse({
      message: 'Combo product updated successfully',
    });
  }

  async remove(id: string, user: IActiveUser) {
    const deletedComboProduct = await this.productModel.findByIdAndUpdate(
      id,
      { softDeleted: true },
      { new: true },
    );
    if (!deletedComboProduct) {
      throw new NotFoundException('Combo product not found');
    }

    await this.activityService.createActivity({
      title: 'Combo Product Deleted',
      action: ActivityAction.DELETE,
      resourceType: ResourceType.COMBO_PRODUCT,
      resourceId: deletedComboProduct._id,
      user: new Types.ObjectId(user.sub),
    });

    return apiResponse({
      status: true,
      message: 'Combo product deleted successfully',
    });
  }

  //!if create or update service
  async addBannerImage(dto: CreateComboBannerDto) {
    const imagesToCleanup: string[] = [];

    try {
      if (dto.image) {
        imagesToCleanup.push(dto.image);
      }
      await this.comboBannerModel.deleteMany();

      const existingBanner = await this.comboBannerModel.findOne({
        softDeleted: false,
      });

      let banner;

      if (!existingBanner) {
        // create banner
        banner = await this.comboBannerModel.create(dto);
      } else {
        // check if image changed
        if (dto.image && dto.image !== existingBanner.image) {
          await this.storageService.deleteFileByUrl(existingBanner.image);
        }

        banner = await this.comboBannerModel.findByIdAndUpdate(
          existingBanner._id,
          dto,
          { new: true },
        );
      }

      if (!banner) {
        throw new BadRequestException('Failed to save combo banner');
      }

      return apiResponse({
        data: banner,
        message: existingBanner
          ? 'Combo banner updated successfully'
          : 'Combo banner added successfully',
      });
    } catch (error) {
      if (imagesToCleanup.length > 0) {
        await Promise.all(
          imagesToCleanup.map((url) =>
            this.storageService.deleteFileByUrl(url),
          ),
        ).catch((s3Err) => console.error('S3 Cleanup Failed:', s3Err));
      }

      throw error;
    }
  }

  //! business logic is only one baanner only have
  async getComboBanner() {
    const comboBanner = await this.comboBannerModel.findOne({
      softDeleted: false,
    });

    return apiResponse({
      data: comboBanner,
      message: 'Combo banner fetched successfully',
    });
  }

  //! no need this service now
  async updateBanner(id: string, dto: Pick<CreateComboBannerDto, 'status'>) {
    const updatedBanner = await this.comboBannerModel.findByIdAndUpdate(
      id,
      dto,
      { new: true },
    );
    if (!updatedBanner) {
      throw new NotFoundException('Combo banner not found');
    }
    return apiResponse({
      data: updatedBanner,
      message: 'Combo banner updated successfully',
    });
  }

  async deleteBanner(id: string) {
    const deletedBanner = await this.comboBannerModel.findByIdAndUpdate(
      id,
      {
        softDeleted: true,
      },
      { new: true },
    );

    if (!deletedBanner) {
      throw new NotFoundException('Combo banner not found');
    }

    return apiResponse({
      status: true,
      message: 'Combo banner deleted successfully',
    });
  }
}
