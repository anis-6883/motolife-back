import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateSellerDto } from '../dto/create-seller.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Seller } from 'src/common/models/seller.schema';
import { SellerVerificationStatus } from 'src/common/enums/seller.enums';

@Injectable()
export class CreateSellerProvider {
  constructor(
    @InjectModel(Seller.name)
    private readonly userModel: Model<Seller>,
  ) {}

  public async create(createUserDto: CreateSellerDto) {
    let existingUser: Seller | null = null;

    existingUser = await this.userModel.findOne({
      $or: [{ email: createUserDto.email }, { phone: createUserDto.phone }],
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const newUser = await this.userModel.create({
      ...createUserDto,
      verificationStatus: SellerVerificationStatus.VERIFIED,
    });

    return newUser;
  }
}
