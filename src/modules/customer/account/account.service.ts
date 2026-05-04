import {
  BadRequestException,
  Injectable,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type AggregatePaginateModel } from 'mongoose';
import { Customer, PaymentMethod } from 'src/common/models/customers.schema';
import { apiResponse } from 'src/common/utils/api-response';
import {
  AddressDto,
  BankPaymentDto,
  BkashPaymentDto,
  CreateCustomerDto,
  PaymentMethodDto,
} from './dto/create-customer.dto';
import { CreateCustomerProvider } from './providers/create-account.provider';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { IActiveUser } from '../auth/interfaces/active-user.interface';
import { PaymentMethodType } from 'src/common/enums/seller.enums';

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(Customer.name)
    private readonly userModel: AggregatePaginateModel<Customer>,
    private readonly createUserProvider: CreateCustomerProvider,
  ) {}

  async create(createUserDto: CreateCustomerDto) {
    const user = await this.createUserProvider.create(createUserDto);
    return apiResponse({ message: 'User created successfully' });
  }

  async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    try {
      const user = await this.userModel.findById(id);
      if (user === null) {
        throw new NotFoundException('User not found');
      }
      return apiResponse({ data: user, message: 'User fetched successfully' });
    } catch (error) {
      throw new RequestTimeoutException(error.message);
    }
  }

  async update(user: IActiveUser, updateUserDto: UpdateCustomerDto) {
    const { paymentMethods, ...rest } = updateUserDto;
    const userId = new Types.ObjectId(user.sub);
    const userExists = await this.userModel.findById(userId);
    if (!userExists) {
      throw new NotFoundException('User not found');
    }

    if (paymentMethods) {
      await this.handlePaymentMethodsUpdate(userExists, paymentMethods);
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(userId, rest, {
      new: true,
    });

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return apiResponse({
      data: updatedUser,
      message: 'User updated successfully',
    });
  }

  async handlePaymentMethodsUpdate(
    customer: Customer,
    paymentMethodsDto: (PaymentMethodDto & { _id?: string })[],
  ): Promise<void> {
    for (const pmDto of paymentMethodsDto) {
      if (pmDto._id) {
        const pmIndex = customer.paymentMethods.findIndex(
          (pm: PaymentMethod & { _id: Types.ObjectId }) =>
            pm._id.toString() === pmDto._id,
        );

        if (pmIndex === -1) {
          throw new BadRequestException(
            `Payment method with id ${pmDto._id} not found`,
          );
        }

        if (pmDto.isDefault === true) {
          customer.paymentMethods.forEach(
            (pm: PaymentMethod & { _id: Types.ObjectId }, index) => {
              if (index !== pmIndex) {
                pm.isDefault = false;
              }
            },
          );
        }

        Object.keys(pmDto).forEach((key) => {
          if (key !== '_id') {
            (customer.paymentMethods[pmIndex] as PaymentMethod)[key] = (
              pmDto as PaymentMethodDto
            )[key];
          }
        });
      } else {
        if (pmDto.isDefault === true) {
          customer.paymentMethods.forEach(
            (pm: PaymentMethod & { _id: Types.ObjectId }) => {
              pm.isDefault = false;
            },
          );
        }

        const newPaymentMethod = this.createPaymentMethodByType(pmDto);
        if (!customer.paymentMethods || customer.paymentMethods?.length === 0) {
          customer.paymentMethods = [];
        }
        customer.paymentMethods.push(newPaymentMethod as any);
      }
    }

    await customer.save();
  }

  createPaymentMethodByType(pmDto: PaymentMethodDto) {
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
          !bankDto.cardNumber ||
          !bankDto.cardHolderName ||
          !bankDto.cvv ||
          !bankDto.expiry
        ) {
          throw new BadRequestException(
            'All bank details are required for bank payment method',
          );
        }
        return {
          methodType: pmDto.methodType,
          isDefault: pmDto.isDefault || false,
          cardNumber: bankDto.cardNumber,
          cardHolderName: bankDto.cardHolderName,
          cvv: bankDto.cvv,
          expiry: bankDto.expiry,
        };
      }

      default:
        throw new BadRequestException('Invalid payment method type');
    }
  }

  async addPaymentMethod(
    user: IActiveUser,
    paymentMethodDto: BkashPaymentDto | BankPaymentDto,
  ): Promise<ReturnType<typeof apiResponse>> {
    const customer = await this.userModel.findById(
      new Types.ObjectId(user.sub),
    );
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (paymentMethodDto.isDefault === true) {
      customer.paymentMethods.forEach(
        (pm: PaymentMethod & { _id: Types.ObjectId }) => {
          pm.isDefault = false;
        },
      );
    }

    const newPaymentMethod = this.createPaymentMethodByType(paymentMethodDto);
    if (!customer.paymentMethods || customer.paymentMethods?.length === 0) {
      customer.paymentMethods = [];
    }
    customer.paymentMethods.push(newPaymentMethod as any);

    await customer.save();
    return apiResponse({
      message: 'Payment method added successfully',
    });
  }

  async removePaymentMethod(
    user: IActiveUser,
    paymentMethodId: string,
  ): Promise<ReturnType<typeof apiResponse>> {
    const customer = await this.userModel.findById(
      new Types.ObjectId(user.sub),
    );
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const pmIndex = customer.paymentMethods.findIndex(
      (pm: PaymentMethod & { _id: Types.ObjectId }) =>
        pm._id.toString() === paymentMethodId,
    );

    if (pmIndex === -1) {
      throw new BadRequestException('Payment method not found');
    }

    customer.paymentMethods.splice(pmIndex, 1);
    await customer.save();

    return apiResponse({
      message: 'Payment method removed successfully',
    });
  }

  async setDefaultPaymentMethod(
    user: IActiveUser,
    paymentMethodId: string,
  ): Promise<ReturnType<typeof apiResponse>> {
    const customer = await this.userModel.findById(
      new Types.ObjectId(user.sub),
    );
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    let found = false;
    customer.paymentMethods.forEach(
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

    await customer.save();
    return apiResponse({
      data: customer,
      message: 'Payment method successfully set as default',
    });
  }

  async remove(id: string) {
    const user = await this.userModel.findByIdAndUpdate(id, {
      softDeleted: true,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return apiResponse({ status: true, message: 'User deleted successfully' });
  }

  async addAddress(user: IActiveUser, addressDto: AddressDto) {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      new Types.ObjectId(user.sub),
      {
        $push: {
          addresses: addressDto,
        },
      },
      { new: true },
    );

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return apiResponse({
      data: updatedUser.addresses,
      message: 'Address added successfully',
    });
  }

  async updateAddress(
    user: IActiveUser,
    addressId: string,
    addressDto: UpdateAddressDto,
  ) {
    const updatePayload = {};
    for (const [key, value] of Object.entries(addressDto)) {
      updatePayload[`addresses.$.${key}`] = value;
    }

    const updatedUser = await this.userModel.findOneAndUpdate(
      { _id: new Types.ObjectId(user.sub), 'addresses._id': addressId },
      { $set: updatePayload },
      { new: true },
    );

    if (!updatedUser) {
      throw new NotFoundException('User or Address not found');
    }

    return apiResponse({
      data: updatedUser.addresses,
      message: 'Address updated successfully',
    });
  }

  async getPaymentMethods(user: IActiveUser) {
    const _user = await this.userModel.findById(new Types.ObjectId(user.sub));
    if (!_user) {
      throw new NotFoundException('User not found');
    }

    return apiResponse({
      data: _user.paymentMethods,
      message: 'Payment methods fetched successfully',
    });
  }

  async getAddresses(user: IActiveUser) {
    const _user = await this.userModel.findById(new Types.ObjectId(user.sub));
    if (!_user) {
      throw new NotFoundException('User not found');
    }

    return apiResponse({
      data: _user.addresses,
      message: 'Addresses fetched successfully',
    });
  }

  async deleteAddress(user: IActiveUser, addressId: string) {
    const updatedUser = await this.userModel.findOneAndUpdate(
      { _id: new Types.ObjectId(user.sub), 'addresses._id': addressId },
      {
        $pull: {
          addresses: { _id: addressId },
        },
      },
      { new: true },
    );

    if (!updatedUser) {
      throw new NotFoundException('User or Address not found');
    }

    return apiResponse({
      data: updatedUser.addresses,
      message: 'Address deleted successfully',
    });
  }
}
