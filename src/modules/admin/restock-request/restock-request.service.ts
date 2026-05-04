import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PipelineStage,
  QueryFilter,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import { RestockRequest } from 'src/common/models/restock-request.schema';
import { apiResponse } from 'src/common/utils/api-response';
import { GetRestockRequestsQueryDto } from './dtos/get-request-restock-query.dto';
import { Product } from 'src/common/models/products.schema';

@Injectable()
export class RestockRequestService {
  constructor(
    @InjectModel(RestockRequest.name)
    private readonly restockRequestModel: AggregatePaginateModel<RestockRequest>,
    @InjectModel(Product.name)
    private readonly productModel: AggregatePaginateModel<Product>,
  ) {}

  async findAll(query: GetRestockRequestsQueryDto) {
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

    const filters: QueryFilter<RestockRequest> = {
      softDeleted: false,
    };

    if (search) {
      const products = await this.productModel
        .find({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { sku: { $regex: search, $options: 'i' } },
          ],
        })
        .select('_id')
        .lean();

      if (products.length > 0) {
        filters.productId = { $in: products.map((p) => p._id) };
      }
    }

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
      message: 'Restock requests fetched successfully',
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
      throw new NotFoundException('Restock request not found');
    }
    return apiResponse({
      data: restockRequest,
      message: 'Restock request fetched successfully',
    });
  }

  async remove(id: string) {
    const deletedRestockRequest =
      await this.restockRequestModel.findByIdAndUpdate(
        id,
        { softDeleted: true },
        { new: true },
      );
    if (!deletedRestockRequest) {
      throw new NotFoundException('Restock request not found');
    }
    return apiResponse({
      status: true,
      message: 'Restock request deleted successfully',
    });
  }
}
