import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PipelineStage, Types, type AggregatePaginateModel } from 'mongoose';
import { RestockRequest } from 'src/common/models/restock-request.schema';
import { apiResponse } from 'src/common/utils/api-response';
import { GetRestockRequestsQueryDto } from './dtos/get-request-restock-query.dto';
import { IActiveUser } from '../auth/interfaces/active-user.interface';

@Injectable()
export class RestockRequestService {
  constructor(
    @InjectModel(RestockRequest.name)
    private readonly restockRequestModel: AggregatePaginateModel<RestockRequest>,
  ) {}

  async findAll(query: GetRestockRequestsQueryDto, user: IActiveUser) {
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
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $match: {
          'product.seller': new Types.ObjectId(user.sub),
          ...(search && { 'product.name': { $regex: search, $options: 'i' } }),
          ...(brand && { 'product.brand': new Types.ObjectId(brand) }),
          ...(category && { 'product.category': new Types.ObjectId(category) }),
          ...(isPublished !== undefined && {
            'product.isPublished': isPublished === 'true',
          }),
        },
      },

      {
        $sort: {
          [sortBy]: sortOrder === 'desc' ? -1 : 1,
        },
      },
      {
        $project: {
          createdAt: 1,
          'product.sellingPrice': 1,
          'product.name': 1,
          'product.sku': 1,
          'product._id': 1,
          'product.thumbnail': 1,
          totalRequests: 1,
          'product.isPublished': 1,
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
      {
        $project: {
          softDeleted: 0,
          updatedAt: 0,
          'product.shippingTime': 0,
          'product.searchTags': 0,
          'product.softDeleted': 0,
          'product.updatedAt': 0,
          productId: 0,
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
