import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Model,
  PipelineStage,
  QueryFilter,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import { Withdraw, WITHDRAW_STATUS } from 'src/common/models/withdraw.schema';
import { apiResponse } from 'src/common/utils/api-response';
import { GetWithdrawQueryDto } from './dtos/get-withdraw-query.dto';
import { UpdateWithdrawDto } from './dtos/update-withdraw.dto';
import { Seller } from 'src/common/models/seller.schema';
import { IActiveUser } from '../auth/interfaces/active-user.interface';
import { CreateWithdrawDto } from './dtos/create-withdraw.dto';

@Injectable()
export class WithdrawService {
  constructor(
    @InjectModel(Withdraw.name)
    private readonly withdrawModel: AggregatePaginateModel<Withdraw>,

    @InjectModel(Seller.name)
    private readonly sellerModel: Model<Seller>,
  ) {}

  async create(dto: CreateWithdrawDto, user: IActiveUser) {
    const sellerExists = await this.sellerModel.findById(user.sub);

    if (!sellerExists) {
      throw new NotFoundException('Seller not found');
    }

    if (sellerExists.balance < dto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    await this.withdrawModel.create({
      ...dto,
      seller: sellerExists._id,
    });

    return apiResponse({
      message: 'Withdraw created successfully',
    });
  }

  async findAll(query: GetWithdrawQueryDto, user: IActiveUser) {
    const { page = 1, limit = 10, search, status, sortBy, sortOrder } = query;

    const filter: QueryFilter<Withdraw> = {
      seller: new Types.ObjectId(user.sub),
      softDeleted: false,
    };

    if (status) {
      filter.status = status;
    }

    const pipeline: PipelineStage[] = [
      { $match: filter },
      {
        $sort: {
          [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1,
        },
      },
    ];

    const result = await this.withdrawModel.aggregatePaginate(pipeline, {
      page,
      limit: limit > 50 ? 50 : limit,
    });
    const { docs, ...rest } = result;

    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Withdraws fetched successfully',
    });
  }

  async getWithdrawStats(user: IActiveUser) {
    const [stats] = await this.withdrawModel.aggregate([
      {
        $match: {
          seller: new Types.ObjectId(user.sub),
          softDeleted: false,
        },
      },
      {
        $group: {
          _id: '$seller',
          requestedBalance: {
            $sum: {
              $cond: [
                { $eq: ['$status', WITHDRAW_STATUS.PENDING] },
                '$amount',
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'sellers',
          localField: '_id',
          foreignField: '_id',
          as: 'sellerInfo',
        },
      },
      { $unwind: '$sellerInfo' },
      {
        $project: {
          _id: 0,
          requestedBalance: 1,
          balance: '$sellerInfo.balance',
          totalWithdrawn: '$sellerInfo.totalWithdrawn',
        },
      },
    ]);

    return apiResponse({
      data: stats || { requestedBalance: 0, balance: 0, totalWithdrawn: 0 },
      message: 'Withdraw stats fetched successfully',
    });
  }

  async findById(
    id: string,
    user: IActiveUser,
  ): Promise<ReturnType<typeof apiResponse>> {
    const [withdraw] = await this.withdrawModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(id),
          seller: new Types.ObjectId(user.sub),
          softDeleted: false,
        },
      },
      {
        $lookup: {
          from: 'sellers',
          localField: 'seller',
          foreignField: '_id',
          as: 'seller',
          pipeline: [
            {
              $project: {
                name: 1,
                store: 1,
                phone: 1,
                email: 1,
                paymentMethods: 1,
              },
            },
          ],
        },
      },
    ]);

    if (!withdraw) {
      throw new NotFoundException('Withdraw not found');
    }

    return apiResponse({
      data: withdraw,
      message: 'Withdraw fetched successfully',
    });
  }

  async update(id: string, updateData: UpdateWithdrawDto, user: IActiveUser) {
    const withdraw = await this.withdrawModel.findById(id);
    if (!withdraw) {
      throw new NotFoundException('Withdraw not found');
    }

    if (withdraw.seller.toString() !== user.sub) {
      throw new BadRequestException(
        'You are not authorized to update this withdraw',
      );
    }

    if (updateData.dispute) {
      for (const key in updateData.dispute) {
        updateData[`dispute.${key}`] = updateData.dispute[key];
      }
      delete updateData.dispute;
    }

    const updatedWithdraw = await this.withdrawModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    );

    return apiResponse({
      data: updatedWithdraw,
      message: 'Withdraw updated successfully',
    });
  }

  async delete(id: string, user: IActiveUser) {
    const withdraw = await this.withdrawModel.findById(id);
    if (!withdraw) {
      throw new NotFoundException('Withdraw not found');
    }

    if (withdraw.seller.toString() !== user.sub) {
      throw new BadRequestException(
        'You are not authorized to delete this withdraw',
      );
    }

    await this.withdrawModel.findByIdAndUpdate(
      id,
      { softDeleted: true },
      { new: true },
    );

    return apiResponse({
      message: 'Withdraw deleted successfully',
    });
  }
}
