import {
  Injectable,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PipelineStage,
  QueryFilter,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import { GetAllSellersQueryDto } from './dto/get-all-sellers-query.dto';
import { apiResponse } from 'src/common/utils/api-response';
import { Seller } from 'src/common/models/seller.schema';

@Injectable()
export class SellersService {
  constructor(
    @InjectModel(Seller.name)
    private readonly userModel: AggregatePaginateModel<Seller>,
  ) {}

  async findAll(query: GetAllSellersQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      verificationStatus,
      accountStatus,
    } = query;

    const filter: QueryFilter<Seller> = {
      softDeleted: false,
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'store.storeName': { $regex: search, $options: 'i' } },
      ];
    }

    if (verificationStatus) {
      filter.verificationStatus = verificationStatus;
    }

    if (accountStatus) {
      filter.accountStatus = accountStatus;
    }

    const pipeline: PipelineStage[] = [
      {
        $match: filter,
      },
      {
        $project: {
          'store.storeName': 1,
          name: 1,
          phone: 1,
          email: 1,
          verificationStatus: 1,
          accountStatus: 1,
          totalProducts: 1,
          totalOrders: 1,
        },
      },
      {
        $sort: {
          [sortBy]: sortOrder === 'asc' ? 1 : -1,
        },
      },
    ];

    const result = await this.userModel.aggregatePaginate(pipeline, {
      page,
      limit: limit > 50 ? 50 : limit,
      sort: {
        [sortBy]: sortOrder === 'asc' ? 1 : -1,
      },
    });

    const { docs, ...rest } = result;
    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Sellers fetched successfully',
    });
  }

  public async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    try {
      const [user] = await this.userModel.aggregate([
        {
          $match: {
            _id: new Types.ObjectId(id),
            softDeleted: false,
          },
        },
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'sellerId',
            as: 'reviews',
          },
        },
        {
          $addFields: {
            totalReviews: {
              $size: '$reviews',
            },
          },
        },
        {
          $project: {
            name: 1,
            'store.storeName': 1,
            'store.logoImage': 1,
            'store.coverImage': 1,
            totalProducts: 1,
            totalReviews: 1,
          },
        },
      ]);

      if (!user) {
        throw new NotFoundException('Seller not found');
      }

      return apiResponse({
        data: user,
        message: 'Seller fetched successfully',
      });
    } catch (error) {
      throw new RequestTimeoutException(error.message);
    }
  }
}
