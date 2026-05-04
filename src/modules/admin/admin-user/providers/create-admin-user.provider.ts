import {
  BadRequestException,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { CreateAdminUserDto } from '../dto/create-admin.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AdminUser } from '../../../../common/models/admin-users.schema';

@Injectable()
export class CreateAdminUserProvider {
  constructor(
    @InjectModel(AdminUser.name)
    private readonly userModel: Model<AdminUser>,
  ) {}

  public async create(createUserDto: CreateAdminUserDto) {
    let existingUser: AdminUser | null = null;

    existingUser = await this.userModel.findOne({
      $or: [{ email: createUserDto.email }, { phone: createUserDto.phone }],
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const newUser = await this.userModel.create({
      ...createUserDto,
      role: new Types.ObjectId(createUserDto.role),
    });

    return newUser;
  }
}
