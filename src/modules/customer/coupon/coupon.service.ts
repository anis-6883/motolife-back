import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PipelineStage,
  QueryFilter,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { Coupon } from 'src/common/models/coupon.schema';
import { GetCouponQueryDto } from './dto/get-coupon-query.dto';
import { IActiveUser } from '../auth/interfaces/active-user.interface';
import { CouponUsage } from 'src/common/models/coupon-usage.schema';

@Injectable()
export class CouponService {
  constructor(
    @InjectModel(Coupon.name)
    private readonly couponModel: AggregatePaginateModel<Coupon>,
    @InjectModel(CouponUsage.name)
    private readonly couponUsageModel: AggregatePaginateModel<CouponUsage>,
  ) {}

  async findAll(user: IActiveUser, query: GetCouponQueryDto) {
    const { page = 1, limit = 10, hasExpired, used } = query;

    if (used === 'true') {
      const filters: QueryFilter<CouponUsage> = {
        customer: new Types.ObjectId(user.sub),
      };

      const pipeline: PipelineStage[] = [
        {
          $match: filters,
        },
        {
          $lookup: {
            from: 'coupons',
            localField: 'coupon',
            foreignField: '_id',
            as: 'coupon',
          },
        },
        { $unwind: '$coupon' },
        { $sort: { createdAt: -1 } },
        {
          $project: {
            coupon: 1,
          },
        },
        { $replaceRoot: { newRoot: '$coupon' } },
      ];

      const result = await this.couponUsageModel.aggregatePaginate(pipeline, {
        page,
        limit: limit > 50 ? 50 : limit,
      });

      const { docs, ...rest } = result;

      return apiResponse({
        data: { docs, pagination: rest },
        message: 'Coupons fetched successfully',
      });
    } else {
      const filters: QueryFilter<Coupon> = {
        softDeleted: false,
        status: true,
        $or: [{ customers: [] }, { customers: new Types.ObjectId(user.sub) }],
        endDate: { $gte: new Date() },
      };

      if (hasExpired === 'true') {
        filters.endDate = { $lt: new Date() };
      }

      const pipeline: PipelineStage[] = [
        {
          $match: filters,
        },
        {
          $lookup: {
            from: 'coupon_usages',
            localField: '_id',
            foreignField: 'coupon',
            as: 'couponUsages',
            pipeline: [
              {
                $match: {
                  customer: new Types.ObjectId(user.sub),
                },
              },
            ],
          },
        },
        {
          $match: {
            $expr: {
              $gt: ['$limit', { $size: '$couponUsages' }],
            },
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $project: {
            softDeleted: 0,
            updatedAt: 0,
          },
        },
      ];

      const result = await this.couponModel.aggregatePaginate(pipeline, {
        page,
        limit: limit > 50 ? 50 : limit,
      });

      const { docs, ...rest } = result;

      return apiResponse({
        data: { docs, pagination: rest },
        message: 'Coupons fetched successfully',
      });
    }
  }
}
