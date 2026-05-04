import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PipelineStage,
  QueryFilter,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import { Refund } from 'src/common/models/refunds.schema';
import { RefundQueryDto } from './dto/refund-query.dto';
import { IActiveUser } from '../auth/interfaces/active-user.interface';
import { apiResponse } from 'src/common/utils/api-response';

@Injectable()
export class RefundService {
  constructor(
    @InjectModel(Refund.name)
    private readonly refundModel: AggregatePaginateModel<Refund>,
  ) {}

  async findAll(user: IActiveUser, query: RefundQueryDto) {
    const { status, page = 1, limit = 10 } = query;

    const filters: QueryFilter<Refund> = {
      softDeleted: false,
      customer: new Types.ObjectId(user.sub),
    };

    if (status) {
      filters.status = status;
    }

    const pipeline: PipelineStage[] = [
      {
        $match: filters,
      },
      {
        $lookup: {
          from: 'sellers',
          localField: 'items.seller',
          foreignField: '_id',
          as: '_itemSellers',
          pipeline: [
            {
              $project: {
                name: 1,
                'store.storeName': 1,
                'store.logoImage': 1,
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
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$_itemSellers',
                            as: 's',
                            cond: { $eq: ['$$s._id', '$$item.seller'] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'order',
          foreignField: '_id',
          as: 'order',
          pipeline: [
            {
              $project: {
                _id: 0,
                orderId: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: '$order',
      },
      {
        $project: {
          updatedAt: 0,
          softDeleted: 0,
          customer: 0,
          _itemSellers: 0,
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
}
