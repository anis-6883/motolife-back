import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PipelineStage, Types, type AggregatePaginateModel } from 'mongoose';
import { LimitedStock } from 'src/common/models/limited-stocks.schema';
import { apiResponse } from 'src/common/utils/api-response';
import { GetLimitedStockQueryDto } from './dtos/get-limited-stock-query.dto';

@Injectable()
export class LimitedStockService {
  constructor(
    @InjectModel(LimitedStock.name)
    private readonly restockRequestModel: AggregatePaginateModel<LimitedStock>,
  ) {}

  async findAll(query: GetLimitedStockQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      brand,
      category,
      isPublished,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const pipeline: PipelineStage[] = [
      { $match: { softDeleted: false } },
      {
        $sort: {
          [sortBy]: sortOrder === 'desc' ? -1 : 1,
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
          pipeline: [
            {
              $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'category',
                pipeline: [
                  {
                    $project: {
                      name: 1,
                      logo: 1,
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
                from: 'categories',
                localField: 'subCategory',
                foreignField: '_id',
                as: 'subCategory',
                pipeline: [
                  {
                    $project: {
                      name: 1,
                      logo: 1,
                    },
                  },
                ],
              },
            },
            {
              $unwind: {
                path: '$subCategory',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: 'brands',
                localField: 'brand',
                foreignField: '_id',
                as: 'brand',
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
                path: '$brand',
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
        },
      },
      { $unwind: '$product' },
      {
        $match: {
          ...(search && { 'product.name': { $regex: search, $options: 'i' } }),
          ...(brand && { 'product.brand': new Types.ObjectId(brand) }),
          ...(category && { 'product.category': new Types.ObjectId(category) }),
          ...(isPublished !== undefined && {
            'product.isPublished': isPublished === 'true',
          }),
        },
      },
      {
        $project: {
          softDeleted: 0,
          'product.softDeleted': 0,
        },
      },
    ];

    const result = await this.restockRequestModel.aggregatePaginate(pipeline, {
      page,
      limit: limit > 50 ? 50 : limit,
    });
    const { docs, ...rest } = result;

    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Limited stock fetched successfully',
    });
  }

  public async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    const [restockRequest] = await this.restockRequestModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(id) },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
          pipeline: [
            {
              $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'category',
                pipeline: [
                  {
                    $project: {
                      name: 1,
                      logo: 1,
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
                from: 'categories',
                localField: 'subCategory',
                foreignField: '_id',
                as: 'subCategory',
                pipeline: [
                  {
                    $project: {
                      name: 1,
                      logo: 1,
                    },
                  },
                ],
              },
            },
            {
              $unwind: {
                path: '$subCategory',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: 'brands',
                localField: 'brand',
                foreignField: '_id',
                as: 'brand',
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
                path: '$brand',
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
        },
      },
    ]);

    if (!restockRequest) {
      throw new NotFoundException('Limited stock not found');
    }
    return apiResponse({
      data: restockRequest,
      message: 'Limited stock fetched successfully',
    });
  }

  async remove(id: string) {
    const deletedLimitedStock =
      await this.restockRequestModel.findByIdAndUpdate(
        id,
        { softDeleted: true },
        { new: true },
      );
    if (!deletedLimitedStock) {
      throw new NotFoundException('Limited stock not found');
    }
    return apiResponse({
      status: true,
      message: 'Limited stock deleted successfully',
    });
  }
}
