import {
  BadRequestException,
  Injectable,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type AggregatePaginateModel, Types } from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import {
  BankPaymentDto,
  BkashPaymentDto,
  CreateSellerDto,
  PaymentMethodDto,
} from './dto/create-seller.dto';
import { CreateSellerProvider } from './providers/create-account.provider';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { PaymentMethod, Seller } from 'src/common/models/seller.schema';
import { PaymentMethodType } from 'src/common/enums/seller.enums';
import { HashingProvider } from 'src/modules/admin/admin-auth/providers/hashing.provider';
import { IActiveUser } from '../auth/interfaces/active-user.interface';

@Injectable()
export class SellerAccountService {
  constructor(
    @InjectModel(Seller.name)
    private readonly sellerModel: AggregatePaginateModel<Seller>,
    private readonly createSellerProvider: CreateSellerProvider,
    private readonly hashingProvider: HashingProvider,
  ) {}

  async create(createUserDto: CreateSellerDto) {
    const hashedPassword = await this.hashingProvider.hashPassword(
      createUserDto.password,
    );
    createUserDto.password = hashedPassword;
    await this.createSellerProvider.create(createUserDto);

    return apiResponse({
      message: 'Seller created successfully',
    });
  }

  public async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    try {
      const seller = await this.sellerModel.findById(id);
      if (seller === null) {
        throw new NotFoundException('Seller not found');
      }
      return apiResponse({
        data: seller,
        message: 'Seller fetched successfully',
      });
    } catch (error) {
      throw new RequestTimeoutException(error.message);
    }
  }

  async update(
    user: IActiveUser,
    updateSellerDto: UpdateSellerDto,
  ): Promise<ReturnType<typeof apiResponse>> {
    const sellerId = new Types.ObjectId(user.sub);
    const seller = await this.sellerModel.findById(sellerId);
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }
    const updateObject: Record<string, any> = {};

    if (updateSellerDto.fullName !== undefined) {
      updateObject.fullName = updateSellerDto.fullName;
    }
    if (updateSellerDto.phone !== undefined) {
      updateObject.phone = updateSellerDto.phone;
    }
    if (updateSellerDto.email !== undefined) {
      updateObject.email = updateSellerDto.email;
    }
    if (updateSellerDto.image !== undefined) {
      updateObject.image = updateSellerDto.image;
    }
    if (updateSellerDto.description !== undefined) {
      updateObject.description = updateSellerDto.description;
    }
    if (updateSellerDto.accountStatus !== undefined) {
      updateObject.accountStatus = updateSellerDto.accountStatus;
    }
    if (updateSellerDto.verificationStatus !== undefined) {
      updateObject.verificationStatus = updateSellerDto.verificationStatus;
    }
    if (updateSellerDto.softDeleted !== undefined) {
      updateObject.softDeleted = updateSellerDto.softDeleted;
    }

    if (updateSellerDto.store) {
      const store = updateSellerDto.store;
      Object.keys(store).forEach((key) => {
        updateObject[`store.${key}`] = store[key as keyof typeof store];
      });
    }

    if (updateSellerDto.manager) {
      const manager = updateSellerDto.manager;
      Object.keys(manager).forEach((key) => {
        updateObject[`manager.${key}`] = manager[key as keyof typeof manager];
      });
    }

    if (updateSellerDto.businessSettings) {
      const businessSettings = updateSellerDto.businessSettings;
      Object.keys(businessSettings).forEach((key) => {
        updateObject[`businessSettings.${key}`] =
          businessSettings[key as keyof typeof businessSettings];
      });
    }

    if (updateSellerDto.paymentMethods) {
      await this.handlePaymentMethodsUpdate(
        seller,
        updateSellerDto.paymentMethods,
      );
    }

    const updatedSeller = await this.sellerModel.findByIdAndUpdate(
      sellerId,
      { $set: updateObject },
      { new: true, runValidators: true },
    );

    return apiResponse({
      data: updatedSeller,
      message: 'Seller updated successfully',
    });
  }

  private async handlePaymentMethodsUpdate(
    seller: Seller,
    paymentMethodsDto: (PaymentMethodDto & { _id?: string })[],
  ): Promise<void> {
    for (const pmDto of paymentMethodsDto) {
      if (pmDto._id) {
        const pmIndex = seller.paymentMethods.findIndex(
          (pm: PaymentMethod & { _id: Types.ObjectId }) =>
            pm._id.toString() === pmDto._id,
        );

        if (pmIndex === -1) {
          throw new BadRequestException(
            `Payment method with id ${pmDto._id} not found`,
          );
        }

        if (pmDto.isDefault === true) {
          seller.paymentMethods.forEach(
            (pm: PaymentMethod & { _id: Types.ObjectId }, index) => {
              if (index !== pmIndex) {
                pm.isDefault = false;
              }
            },
          );
        }

        Object.keys(pmDto).forEach((key) => {
          if (key !== '_id') {
            (seller.paymentMethods[pmIndex] as any)[key] = (pmDto as any)[key];
          }
        });
      } else {
        if (pmDto.isDefault === true) {
          seller.paymentMethods.forEach(
            (pm: PaymentMethod & { _id: Types.ObjectId }) => {
              pm.isDefault = false;
            },
          );
        }

        const newPaymentMethod = this.createPaymentMethodByType(pmDto);
        seller.paymentMethods.push(newPaymentMethod as any);
      }
    }

    await seller.save();
  }

  private createPaymentMethodByType(pmDto: PaymentMethodDto) {
    switch (pmDto.methodType) {
      case PaymentMethodType.BKASH: {
        const bkashDto = pmDto;
        if (!bkashDto.phone) {
          throw new BadRequestException(
            'Phone number is required for bKash payment method',
          );
        }
        return {
          methodType: pmDto.methodType,
          isDefault: pmDto.isDefault || false,
          phone: bkashDto.phone,
        };
      }

      case PaymentMethodType.BANK: {
        const bankDto = pmDto;
        if (
          !bankDto.bankName ||
          !bankDto.accountHolderName ||
          !bankDto.accountNumber ||
          !bankDto.branchName
        ) {
          throw new BadRequestException(
            'All bank details are required for bank payment method',
          );
        }
        return {
          methodType: pmDto.methodType,
          isDefault: pmDto.isDefault || false,
          bankName: bankDto.bankName,
          accountHolderName: bankDto.accountHolderName,
          accountNumber: bankDto.accountNumber,
          branchName: bankDto.branchName,
        };
      }

      default:
        throw new BadRequestException('Invalid payment method type');
    }
  }

  async addPaymentMethod(
    sellerId: string,
    paymentMethodDto: BkashPaymentDto | BankPaymentDto,
  ): Promise<ReturnType<typeof apiResponse>> {
    const seller = await this.sellerModel.findById(sellerId);
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    if (paymentMethodDto.isDefault === true) {
      seller.paymentMethods.forEach(
        (pm: PaymentMethod & { _id: Types.ObjectId }) => {
          pm.isDefault = false;
        },
      );
    }

    const newPaymentMethod = this.createPaymentMethodByType(paymentMethodDto);
    seller.paymentMethods.push(newPaymentMethod as any);

    await seller.save();
    return apiResponse({
      data: seller,
      message: 'Payment method added successfully',
    });
  }

  async removePaymentMethod(
    sellerId: string,
    paymentMethodId: string,
  ): Promise<ReturnType<typeof apiResponse>> {
    const seller = await this.sellerModel.findById(sellerId);
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const pmIndex = seller.paymentMethods.findIndex(
      (pm: PaymentMethod & { _id: Types.ObjectId }) =>
        pm._id.toString() === paymentMethodId,
    );

    if (pmIndex === -1) {
      throw new BadRequestException('Payment method not found');
    }

    seller.paymentMethods.splice(pmIndex, 1);
    await seller.save();

    return apiResponse({
      data: seller,
      message: 'Payment method removed successfully',
    });
  }

  async setDefaultPaymentMethod(
    sellerId: string,
    paymentMethodId: string,
  ): Promise<ReturnType<typeof apiResponse>> {
    const seller = await this.sellerModel.findById(sellerId);
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    let found = false;
    seller.paymentMethods.forEach(
      (pm: PaymentMethod & { _id: Types.ObjectId }) => {
        if (pm._id.toString() === paymentMethodId) {
          pm.isDefault = true;
          found = true;
        } else {
          pm.isDefault = false;
        }
      },
    );

    if (!found) {
      throw new BadRequestException('Payment method not found');
    }

    await seller.save();
    return apiResponse({
      data: seller,
      message: 'Payment method successfully set as default',
    });
  }

  async remove(id: string) {
    const seller = await this.sellerModel.findByIdAndUpdate(id, {
      softDeleted: true,
    });
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }
    return apiResponse({
      status: true,
      message: 'Seller deleted successfully',
    });
  }

  async getStats(user: IActiveUser) {
    const [seller] = await this.sellerModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(user.sub),
        },
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'seller',
          as: 'reviews',
          pipeline: [
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
          totalProducts: 1,
          totalReviews: {
            $ifNull: [{ $arrayElemAt: ['$reviews.count', 0] }, 0],
          },
        },
      },
    ]);

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    return apiResponse({
      data: seller,
      message: 'Seller stats fetched successfully',
    });
  }
}
