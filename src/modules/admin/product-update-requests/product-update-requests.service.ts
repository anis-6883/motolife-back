import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  type AggregatePaginateModel,
  Model,
  PipelineStage,
  QueryFilter,
  Types,
} from 'mongoose';
import { UpdateRequests } from 'src/common/models/products-update-requests.schema';
import { Product } from 'src/common/models/products.schema';
import { apiResponse } from 'src/common/utils/api-response';
import { UPDATE_REQUEST_STATUS } from 'src/common/enums/products.enum';
import { UpdateRequestDto } from './dtos/update-request-dto';
import { GetProductUpdateRequestsQueryDto } from './dtos/update-request-query.dto';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction, ResourceType } from 'src/common/enums/admin.enum';
import { IActiveUser } from '../admin-auth/interfaces/active-user.interface';

@Injectable()
export class ProductUpdateRequestsService {
  constructor(
    @InjectModel(UpdateRequests.name)
    private readonly updateRequestsModel: AggregatePaginateModel<UpdateRequests>,
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,

    private readonly activityService: ActivityService,
  ) {}

  async findAll(query: GetProductUpdateRequestsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      seller,
      category,
      date,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filters: QueryFilter<UpdateRequests> = { softDeleted: false };

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
        $lookup: {
          from: 'sellers',
          localField: 'sellerId',
          foreignField: '_id',
          as: 'seller',
          pipeline: [
            {
              $project: {
                name: 1,
              },
            },
          ],
        },
      },
      { $unwind: '$seller' },
      {
        $match: {
          ...(search && { 'product.name': { $regex: search, $options: 'i' } }),
          ...(category && { 'product.category': new Types.ObjectId(category) }),
          ...(seller && { 'product.seller': new Types.ObjectId(seller) }),
        },
      },
      {
        $sort: {
          [sortBy]: sortOrder === 'desc' ? -1 : 1,
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

  async findOne(id: string) {
    const [request] = await this.updateRequestsModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(id) },
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
    ]);

    if (!request) {
      throw new NotFoundException('Update request not found');
    }

    return apiResponse({
      data: request,
      message: 'Product update request fetched successfully',
    });
  }

  async approve(id: string, user: IActiveUser) {
    const session = await this.updateRequestsModel.db.startSession();
    session.startTransaction();

    try {
      const request = await this.updateRequestsModel
        .findById(id)
        .session(session);
      if (!request) {
        throw new NotFoundException('Update request not found');
      }

      if (request.status !== UPDATE_REQUEST_STATUS.PENDING) {
        throw new Error(`Request is already ${request.status}`);
      }

      const updatedProduct = await this.productModel.findByIdAndUpdate(
        request.productId,
        { $set: request.changedData },
        { new: true, session },
      );

      if (!updatedProduct) {
        throw new NotFoundException('Product not found');
      }

      request.status = UPDATE_REQUEST_STATUS.APPROVED;
      await request.save({ session });

      await this.activityService.createActivity(
        {
          title: 'Product Request Approved',
          action: ActivityAction.UPDATE,
          resourceType: ResourceType.PRODUCT_REQUEST,
          resourceId: request._id,
          user: new Types.ObjectId(user.sub),
          payload: request.changedData,
        },
        session,
      );

      await session.commitTransaction();

      return apiResponse({
        data: updatedProduct,
        message: 'Product update request approved and applied successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async reject(id: string, requestDto: UpdateRequestDto, user: IActiveUser) {
    const request = await this.updateRequestsModel.findById(id);
    if (!request) {
      throw new NotFoundException('Update request not found');
    }

    if (request.status !== UPDATE_REQUEST_STATUS.PENDING) {
      throw new Error(`Request is already ${request.status}`);
    }

    request.status = UPDATE_REQUEST_STATUS.REJECTED;
    if (requestDto.note) {
      request.note = requestDto.note;
    }
    await request.save();

    await this.activityService.createActivity({
      title: 'Product Request Rejected',
      action: ActivityAction.UPDATE,
      resourceType: ResourceType.PRODUCT_REQUEST,
      resourceId: request._id,
      user: new Types.ObjectId(user.sub),
      payload: request.changedData,
    });

    return apiResponse({
      message: 'Product update request rejected successfully',
    });
  }
}
