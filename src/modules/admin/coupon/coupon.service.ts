import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PipelineStage,
  QueryFilter,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Coupon, CouponType } from 'src/common/models/coupon.schema';
import { GetCouponQueryDto } from './dto/get-coupon-query.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { DISCOUNT_TYPE } from 'src/common/enums/products.enum';

@Injectable()
export class CouponService {
  constructor(
    @InjectModel(Coupon.name)
    private readonly couponModel: AggregatePaginateModel<Coupon>,
  ) {}

  async create(dto: CreateCouponDto) {
    if (dto.type !== CouponType.FREE_DELIVERY) {
      if (
        dto.discountType === DISCOUNT_TYPE.PERCENTAGE &&
        (dto.discountValue! <= 0 || dto.discountValue! > 100)
      ) {
        throw new BadRequestException(
          'Discount value must be greater than 0 and less than 100',
        );
      }
    }

    if (dto.startDate && dto.endDate) {
      if (new Date(dto.startDate) > new Date(dto.endDate)) {
        throw new BadRequestException('Start date must be less than end date');
      }
    }

    await this.couponModel.create(dto);

    return apiResponse({
      message: 'Coupon created successfully',
    });
  }

  async findAll(query: GetCouponQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      seller,
      customer,
      date,
      bearer,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filters: QueryFilter<Coupon> = { softDeleted: false };

    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      filters.status = status === 'true';
    }

    if (type) {
      filters.type = type;
    }

    if (bearer) {
      filters.bearer = bearer;
    }

    if (seller) {
      filters.sellers = seller;
    }

    if (customer) {
      filters.customers = customer;
    }

    if (date) {
      if (date === 'week') {
        filters.createdAt = {
          $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        };
      } else if (date === 'month') {
        filters.createdAt = {
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        };
      } else {
        filters.createdAt = {
          $gte: new Date(date),
          $lt: new Date(date + 'T23:59:59.999Z'),
        };
      }
    }

    const pipeline: PipelineStage[] = [
      {
        $match: filters,
      },
      {
        $sort: { [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1 },
      },
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
        $lookup: {
          from: 'customers',
          localField: 'customers',
          foreignField: '_id',
          as: 'customers',
          pipeline: [
            {
              $project: {
                fullName: 1,
              },
            },
          ],
        },
      },
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

  async findById(id: string) {
    const coupon = await this.couponModel.findById(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return apiResponse({
      data: coupon,
      message: 'Coupon fetched successfully',
    });
  }

  async update(id: string, updateCouponDto: UpdateCouponDto) {
    if (updateCouponDto.type !== CouponType.FREE_DELIVERY) {
      if (
        updateCouponDto.discountType === DISCOUNT_TYPE.PERCENTAGE &&
        (updateCouponDto.discountValue! <= 0 ||
          updateCouponDto.discountValue! > 100)
      ) {
        throw new BadRequestException(
          'Discount value must be greater than 0 and less than 100',
        );
      }
    }

    if (updateCouponDto.startDate && updateCouponDto.endDate) {
      if (
        new Date(updateCouponDto.startDate) > new Date(updateCouponDto.endDate)
      ) {
        throw new BadRequestException('Start date must be less than end date');
      }
    }

    const updatedCoupon = await this.couponModel.findByIdAndUpdate(
      id,
      updateCouponDto,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedCoupon) {
      throw new NotFoundException('Coupon not found');
    }
    return apiResponse({
      message: 'Coupon updated successfully',
    });
  }

  async remove(id: string) {
    const deletedCoupon = await this.couponModel.findByIdAndUpdate(
      id,
      {
        softDeleted: true,
      },
      { new: true },
    );

    if (!deletedCoupon) {
      throw new NotFoundException('Coupon not found');
    }
    return apiResponse({
      status: true,
      message: 'Coupon deleted successfully',
    });
  }
}
