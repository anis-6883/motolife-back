import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  type AggregatePaginateModel,
  PipelineStage,
  QueryFilter,
  Types,
} from 'mongoose';
import { UpdateRequests } from 'src/common/models/products-update-requests.schema';
import { apiResponse } from 'src/common/utils/api-response';
import { GetProductUpdateRequestsQueryDto } from './dtos/update-request-query.dto';
import { IActiveUser } from '../auth/interfaces/active-user.interface';

@Injectable()
export class ProductUpdateRequestsService {
  constructor(
    @InjectModel(UpdateRequests.name)
    private readonly updateRequestsModel: AggregatePaginateModel<UpdateRequests>,
  ) {}

  async findAll(query: GetProductUpdateRequestsQueryDto, user: IActiveUser) {
    const { page = 1, limit = 10, search } = query;

    const filters: QueryFilter<UpdateRequests> = {
      sellerId: new Types.ObjectId(user.sub),
      softDeleted: false,
    };

    const pipeline: PipelineStage[] = [
      { $match: filters },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
          pipeline: [
            {
              $project: {
                name: 1,
                productId: 1,
              },
            },
          ],
        },
      },
      { $unwind: '$product' },
      {
        $match: {
          ...(search && { 'product.name': { $regex: search, $options: 'i' } }),
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $project: {
          softDeleted: 0,
          updatedAt: 0,
          productId: 0,
          sellerId: 0,
        },
      },
    ];

    const result = await this.updateRequestsModel.aggregatePaginate(pipeline, {
      page,
      limit: limit > 50 ? 50 : limit,
    });
    const { docs, ...rest } = result;

    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Product update requests fetched successfully',
    });
  }

  async findOne(id: string, user: IActiveUser) {
    const [request] = await this.updateRequestsModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(id),
          sellerId: new Types.ObjectId(user.sub),
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $unwind: '$product',
      },
      {
        $project: {
          softDeleted: 0,
          updatedAt: 0,
          productId: 0,
          sellerId: 0,
          'product.softDeleted': 0,
          'product.updatedAt': 0,
          'product.searchTags': 0,
          'product.seller': 0,
        },
      },
    ]);

    if (!request) {
      throw new NotFoundException('Update request not found');
    }

    return apiResponse({
      data: request,
      message: 'Product update request fetched successfully',
    });
  }
}
