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
import { IActiveUser } from '../auth/interfaces/active-user.interface';
import { CreateComboProductDto } from 'src/common/dtos/combo-products/create-combo-products.dto';
import { GetComboProductsQueryDto } from 'src/common/dtos/combo-products/get-combo-products-query.dto';
import { UpdateComboProductDto } from 'src/common/dtos/combo-products/update-combo-products.dto';
import { BusinessSettings } from 'src/common/models/business-settings.schema';

@Injectable()
export class ComboProductService {
  constructor(
    @InjectModel(ComboProduct.name)
    private readonly productModel: AggregatePaginateModel<ComboProduct>,
    @InjectModel(BusinessSettings.name)
    private readonly businessSettingsModel: Model<BusinessSettings>,
  ) {}

  async create(
    createComboProductDto: CreateComboProductDto,
    user: IActiveUser,
  ) {
    const vendorSettings = await this.businessSettingsModel
      .findOne({})
      .select('vendor')
      .lean();

    // if (!vendorSettings?.vendor?.canAddComboProduct) {
    //   throw new BadRequestException('You can not create combo product');
    // }

    await this.productModel.create({
      ...createComboProductDto,
      seller: new Types.ObjectId(user.sub),
    });

    return apiResponse({
      message: 'Combo product created successfully',
    });
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
      status,
    } = query;

    const filters: QueryFilter<ComboProduct> = { softDeleted: false };

    if (search) {
      filters.name = { $regex: search, $options: 'i' };
    }

    if (seller) {
      filters.seller = new Types.ObjectId(seller);
    }

    if (status) {
      filters.status = status;
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

  public async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    const [product] = await this.productModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(id) },
      },
      {
        $lookup: {
          from: 'benefits',
          localField: 'benefits',
          foreignField: '_id',
          as: 'benefits',
          pipeline: [
            {
              $project: {
                title: 1,
                benefits: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$benefits',
          preserveNullAndEmptyArrays: true,
        },
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
      throw new NotFoundException('Product not found');
    }
    return apiResponse({
      data: product,
      message: 'Product fetched successfully',
    });
  }

  async update(id: string, updateComboProductDto: UpdateComboProductDto) {
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
      throw new NotFoundException(`Combo Product with ID ${id} not found`);
    }

    return apiResponse({
      data: updatedComboProduct,
      message: 'Combo product updated successfully',
    });
  }

  async remove(id: string) {
    const deletedComboProduct = await this.productModel.findByIdAndUpdate(
      id,
      { softDeleted: true },
      { new: true },
    );
    if (!deletedComboProduct) {
      throw new NotFoundException('Combo Product not found');
    }
    return apiResponse({
      status: true,
      message: 'Combo Product deleted successfully',
    });
  }
}
