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

@Injectable()
export class WithdrawService {
  constructor(
    @InjectModel(Withdraw.name)
    private readonly withdrawModel: AggregatePaginateModel<Withdraw>,

    @InjectModel(Seller.name)
    private readonly sellerModel: Model<Seller>,
  ) {}

  async findAll(query: GetWithdrawQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      seller,
      sortBy,
      sortOrder,
      date,
    } = query;

    const filter: QueryFilter<Withdraw> = { softDeleted: false };

    if (status) {
      filter.status = status;
    }

    if (seller) {
      filter.seller = new Types.ObjectId(seller);
    }

    if (date === 'today') {
      filter.createdAt = {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999)),
      };
    } else if (date === 'week') {
      filter.createdAt = {
        $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999)),
      };
    } else if (date === 'month') {
      filter.createdAt = {
        $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999)),
      };
    }

    const pipeline: PipelineStage[] = [
      { $match: filter },
      {
        $lookup: {
          from: 'sellers',
          localField: 'seller',
          foreignField: '_id',
          as: 'seller',
          pipeline: [
            {
              $match: {
                ...(search ? { name: { $regex: search, $options: 'i' } } : {}),
              },
            },
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
        $unwind: {
          path: '$seller',
          preserveNullAndEmptyArrays: true,
        },
      },
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

  async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    const [withdraw] = await this.withdrawModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(id) },
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

  async update(id: string, updateData: UpdateWithdrawDto) {
    const session = await this.withdrawModel.db.startSession();
    session.startTransaction();

    try {
      const withdraw = await this.withdrawModel.findById(id).session(session);
      if (!withdraw) {
        throw new NotFoundException('Withdraw not found');
      }

      if (withdraw.status === WITHDRAW_STATUS.APPROVED) {
        throw new BadRequestException('Withdraw has already been approved');
      }

      if (withdraw.status === WITHDRAW_STATUS.DENIED) {
        throw new BadRequestException('Cannot update a denied withdrawal');
      }

      if (updateData.status && updateData.status === WITHDRAW_STATUS.APPROVED) {
        const seller = await this.sellerModel
          .findById(withdraw.seller)
          .session(session);

        if (!seller) {
          throw new NotFoundException('Seller not found');
        }

        if (seller.balance < withdraw.amount) {
          throw new BadRequestException(`Insufficient balance.`);
        }

        await this.sellerModel.updateOne(
          { _id: withdraw.seller },
          {
            $inc: {
              balance: -Number(withdraw.amount),
              totalWithdrawn: Number(withdraw.amount),
            },
          },
          { session },
        );
      }

      Object.assign(withdraw, updateData);
      await withdraw.save({ session });

      await session.commitTransaction();

      return apiResponse({
        data: withdraw,
        message: 'Withdraw updated successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
