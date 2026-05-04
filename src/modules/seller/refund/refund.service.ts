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

@Injectable()
export class RefundService {
  constructor(
    @InjectModel(Refund.name)
    private readonly refundModel: AggregatePaginateModel<Refund>,
  ) {}

  async findAll(query: GetRefundQueryDto) {
    const { page = 1, limit = 10, search, status } = query;

    const filter: QueryFilter<Refund> = { softDeleted: false };

    if (status) {
      filter.status = status;
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
              $project: {
                orderId: 1,
                status: 1,
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
                name: 1,
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
      {
        $project: {
          softDeleted: 0,
          updatedAt: 0,
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

  public async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
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
                      'store.image': 1,
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
                name: 1,
                totalOrders: 1,
                phone: 1,
                email: 1,
              },
            },
          ],
        },
      },
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
}
