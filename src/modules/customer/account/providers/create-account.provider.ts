import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer } from 'src/common/models/customers.schema';

@Injectable()
export class CreateCustomerProvider {
  constructor(
    @InjectModel(Customer.name)
    private readonly userModel: Model<Customer>,
  ) {}

  public async create(createUserDto: CreateCustomerDto) {
    const duplicateFilters: Array<{ phone?: string; email?: string }> = [
      { phone: createUserDto.phone },
    ];
    // if (createUserDto.email) {
    //   duplicateFilters.push({ email: createUserDto.email });
    // }

    const existingUser = await this.userModel.findOne({
      $or: duplicateFilters,
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const newUser = await this.userModel.create(createUserDto);

    return newUser;
  }
}
