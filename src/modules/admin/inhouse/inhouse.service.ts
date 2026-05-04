import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type AggregatePaginateModel } from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { UpdateInhouseDto } from './dto/update-inhouse.dto';
import { Seller } from 'src/common/models/seller.schema';
import { ShopType, VacationDurationType } from 'src/common/enums/seller.enums';

@Injectable()
export class InhouseService {
  constructor(
    @InjectModel(Seller.name)
    private readonly sellerModel: AggregatePaginateModel<Seller>,
  ) {}

  async getInhouse(): Promise<ReturnType<typeof apiResponse>> {
    const seller = await this.sellerModel
      .findOne({
        shopType: ShopType.INHOUSE,
      })
      .select(
        'store businessSettings name email phone image verificationStatus',
      );

    if (!seller) {
      throw new NotFoundException('Inhouse not found');
    }

    return apiResponse({
      data: seller,
      message: 'Inhouse fetched successfully',
    });
  }

  async update(
    updateInhouseDto: UpdateInhouseDto,
  ): Promise<ReturnType<typeof apiResponse>> {
    const $set: Record<string, any> = {};
    const seller = await this.sellerModel.findOne({
      shopType: ShopType.INHOUSE,
    });

    if (!seller) {
      throw new NotFoundException('Inhouse not found');
    }
    const updateObject: Record<string, any> = {};

    if (updateInhouseDto.name !== undefined) {
      updateObject.name = updateInhouseDto.name;
    }
    if (updateInhouseDto.phone !== undefined) {
      updateObject.phone = updateInhouseDto.phone;
    }
    if (updateInhouseDto.email !== undefined) {
      updateObject.email = updateInhouseDto.email;
    }
    if (updateInhouseDto.image !== undefined) {
      updateObject.image = updateInhouseDto.image;
    }

    if (updateInhouseDto.store) {
      Object.entries(updateInhouseDto.store).forEach(([key, value]) => {
        if (value !== undefined) {
          $set[`store.${key}`] = value;
        }
      });
    }

    if (updateInhouseDto.businessSettings) {
      const { vacation, ...restSettings } = updateInhouseDto.businessSettings;
      Object.entries(restSettings).forEach(([key, value]) => {
        if (value !== undefined) {
          $set[`businessSettings.${key}`] = value;
        }
      });
      if (vacation !== undefined) {
        if (vacation.isOnVacation === true) {
          // ── Enable vacation — calculate endsAt from durationType ───────────
          const durationMs: Record<VacationDurationType, number | null> = {
            [VacationDurationType.THIRTY_MINUTES]: 30 * 60 * 1000,
            [VacationDurationType.ONE_HOUR]: 1 * 60 * 60 * 1000,
            [VacationDurationType.TWO_HOURS]: 2 * 60 * 60 * 1000,
            [VacationDurationType.THREE_HOURS]: 3 * 60 * 60 * 1000,
            [VacationDurationType.FOUR_HOURS]: 4 * 60 * 60 * 1000,
            [VacationDurationType.FIVE_HOURS]: 5 * 60 * 60 * 1000,
            [VacationDurationType.CUSTOM]: null,
            [VacationDurationType.UNTIL_CHANGE]: null,
          };

          const now = new Date();
          const ms = vacation.durationType
            ? durationMs[vacation.durationType]
            : null;

          $set['businessSettings.vacation.isOnVacation'] = true;
          $set['businessSettings.vacation.durationType'] =
            vacation.durationType ?? null;
          $set['businessSettings.vacation.note'] = vacation.note ?? '';
          $set['businessSettings.vacation.startAt'] = now;
          $set['businessSettings.vacation.endsAt'] = ms
            ? new Date(now.getTime() + ms)
            : null;
        } else if (vacation.isOnVacation === false) {
          $set['businessSettings.vacation.isOnVacation'] = false;
          $set['businessSettings.vacation.durationType'] = null;
          $set['businessSettings.vacation.startAt'] = null;
          $set['businessSettings.vacation.endsAt'] = null;
          $set['businessSettings.vacation.note'] = '';
        }
      }
    }
    if (Object.keys($set).length === 0) {
      return apiResponse({ data: seller, message: 'Nothing to update' });
    }
    const updatedInhouse = await this.sellerModel.findOneAndUpdate(
      { shopType: ShopType.INHOUSE },
      { $set },
      { new: true, runValidators: true },
    );

    return apiResponse({
      data: updatedInhouse,
      message: 'Inhouse updated successfully',
    });
  }

  async getStats() {
    const [seller] = await this.sellerModel.aggregate([
      {
        $match: {
          shopType: ShopType.INHOUSE,
        },
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'sellerId',
          as: 'reviews',
          pipeline: [
            {
              $match: {
                softDeleted: false,
              },
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'seller',
          as: 'products',
          pipeline: [
            {
              $match: {
                softDeleted: false,
              },
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
      {
        $project: {
          totalOrders: 1,
          totalProducts: {
            $ifNull: [{ $arrayElemAt: ['$products.count', 0] }, 0],
          },
          totalReviews: {
            $ifNull: [{ $arrayElemAt: ['$reviews.count', 0] }, 0],
          },
        },
      },
    ]);

    if (!seller) {
      throw new NotFoundException('Inhouse not found');
    }

    return apiResponse({
      data: seller,
      message: 'Inhouse stats fetched successfully',
    });
  }
}
