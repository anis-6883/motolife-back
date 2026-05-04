import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PipelineStage,
  QueryFilter,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import { Refund } from 'src/common/models/refunds.schema';
import { apiResponse } from 'src/common/utils/api-response';
import { GetRefundQueryDto } from './dtos/get-refund-query.dto';
import { MakeRefundDto, RejectRefundDto } from './dtos/refund.dto';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction, ResourceType } from 'src/common/enums/admin.enum';
import { IActiveUser } from '../admin-auth/interfaces/active-user.interface';
import { UpdateRefundDto } from './dtos/update-refund.dto';
import { RefundAllProvider } from './providers/refund-all.provider';
import { RefundSingleProvider } from './providers/refund-single.provider';
import { RejectAllProvider } from './providers/reject-all.provider';
import { RejectSingleProvider } from './providers/reject-single.provider';
import { Order } from 'src/common/models/order.schema';

@Injectable()
export class RefundService {
  constructor(
    @InjectModel(Refund.name)
    private readonly refundModel: AggregatePaginateModel<Refund>,
    @InjectModel(Order.name)
    private readonly orderModel: AggregatePaginateModel<Order>,
    private readonly activityService: ActivityService,
    private readonly refundAllProvider: RefundAllProvider,
    private readonly refundSingleProvider: RefundSingleProvider,
    private readonly rejectAllProvider: RejectAllProvider,
    private readonly rejectSingleProvider: RejectSingleProvider,
  ) {}

  async findAll(query: GetRefundQueryDto) {
    const { page = 1, limit = 10, search, status } = query;

    const filter: QueryFilter<Refund> = { softDeleted: false };

    if (status) {
      filter.status = status;
    }
    if (search) {
      const orderIds = await this.orderModel
        .find({
          orderId: { $regex: search, $options: 'i' },
        })
        .select('_id');

      filter.$or = [
        { order: { $in: orderIds.map((order) => order._id) } },
        {
          refundId: { $regex: search, $options: 'i' },
        },
      ];
    }

    const pipeline: PipelineStage[] = [
      { $match: filter },
      {
        $lookup: {
          from: 'orders',
          localField: 'order',
          foreignField: '_id',
          as: 'order',
          pipeline: [
            {
              $lookup: {
                from: 'sellers',
                localField: 'sellers',
                foreignField: '_id',
                as: 'sellers',
                pipeline: [
                  {
                    $project: {
                      name: 1,
                      'store.storeName': 1,
                    },
                  },
                ],
              },
            },
            {
              $project: {
                orderId: 1,
                status: 1,
                sellers: 1,
              },
            },
          ],
        },
      },
      { $unwind: '$order' },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
          pipeline: [
            {
              $project: {
                fullName: 1,
                totalOrders: 1,
                phone: 1,
                email: 1,
              },
            },
          ],
        },
      },
      { $unwind: '$customer' },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ];

    const result = await this.refundModel.aggregatePaginate(pipeline, {
      page,
      limit: limit > 50 ? 50 : limit,
    });
    const { docs, ...rest } = result;

    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Refunds fetched successfully',
    });
  }

  async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    const [refund] = await this.refundModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(id) },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'order',
          foreignField: '_id',
          as: 'order',
          pipeline: [
            {
              $lookup: {
                from: 'sellers',
                localField: 'sellers',
                foreignField: '_id',
                as: 'sellers',
                pipeline: [
                  {
                    $project: {
                      name: 1,
                      'store.storeName': 1,
                      'store.logoImage': 1,
                      totalOrders: 1,
                      'store.address': 1,
                      phone: 1,
                      isVerified: 1,
                    },
                  },
                ],
              },
            },
            {
              $unwind: {
                path: '$sellers',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                orderId: 1,
                status: 1,
                sellers: 1,
              },
            },
          ],
        },
      },
      { $unwind: '$order' },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
          pipeline: [
            {
              $project: {
                fullName: 1,
                totalOrders: 1,
                phone: 1,
                email: 1,
              },
            },
          ],
        },
      },

      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product',
          pipeline: [
            {
              $lookup: {
                from: 'sellers',
                localField: 'seller',
                foreignField: '_id',
                as: 'seller',
                pipeline: [
                  {
                    $project: {
                      _id: 0,
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
              $project: {
                seller: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          items: {
            $map: {
              input: '$items',
              as: 'item',
              in: {
                $mergeObjects: [
                  '$$item',
                  {
                    seller: {
                      $let: {
                        vars: {
                          matchedProduct: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: '$product',
                                  as: 'p',
                                  cond: { $eq: ['$$p._id', '$$item.product'] },
                                },
                              },
                              0,
                            ],
                          },
                        },
                        in: '$$matchedProduct.seller',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      { $unset: 'product' },
      { $unwind: '$customer' },
    ]);

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }
    return apiResponse({
      data: refund,
      message: 'Refund fetched successfully',
    });
  }

  async updateRefund(id: string, update: UpdateRefundDto, user: IActiveUser) {
    const session = await this.refundModel.db.startSession();
    session.startTransaction();
    try {
      const refund = await this.refundModel.findByIdAndUpdate(id, update, {
        new: true,
        session,
      });

      if (!refund) {
        throw new NotFoundException('Refund not found');
      }

      await this.activityService.createActivity(
        {
          title: update.status
            ? `Changed refund Status to ${update.status?.charAt(0)?.toUpperCase() + update.status?.slice(1)?.toLowerCase()}`
            : 'Refund Updated',
          action: ActivityAction.UPDATE,
          resourceType: ResourceType.REFUND,
          resourceId: refund._id,
          user: new Types.ObjectId(user.sub),
          payload: update,
        },
        session,
      );

      await session.commitTransaction();

      return apiResponse({
        message: 'Refund updated successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  refundAll(
    refundId: string,
    user: IActiveUser,
    dto: Pick<MakeRefundDto, 'refundMethod'>,
  ) {
    return this.refundAllProvider.refundAll(refundId, user, dto);
  }

  refundSingle(refundId: string, dto: MakeRefundDto, user: IActiveUser) {
    return this.refundSingleProvider.refundSingle(refundId, dto, user);
  }

  rejectSingle(refundId: string, dto: MakeRefundDto, user: IActiveUser) {
    return this.rejectSingleProvider.rejectSingle(refundId, dto, user);
  }

  rejectAll(refundId: string, dto: RejectRefundDto, user: IActiveUser) {
    return this.rejectAllProvider.rejectAll(refundId, dto, user);
  }
}
