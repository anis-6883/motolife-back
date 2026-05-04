import {
  Injectable,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { CreateAdminUserDto } from './dto/create-admin.dto';
import { UpdateAdminUserDto } from './dto/update-admin.dto';
import { CreateAdminUserProvider } from './providers/create-admin-user.provider';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, type AggregatePaginateModel } from 'mongoose';
import { GetAllUsersQueryDto } from './dto/get-all-users-query.dto';
import { AdminUser } from '../../../common/models/admin-users.schema';
import { apiResponse } from 'src/common/utils/api-response';
import { HashingProvider } from '../admin-auth/providers/hashing.provider';

@Injectable()
export class AdminUserService {
  constructor(
    @InjectModel(AdminUser.name)
    private readonly userModel: AggregatePaginateModel<AdminUser>,
    private readonly hashingProvider: HashingProvider,
    private readonly createUserProvider: CreateAdminUserProvider,
  ) {}

  async create(createUserDto: CreateAdminUserDto) {
    const hashedPassword = await this.hashingProvider.hashPassword(
      createUserDto.password,
    );
    await this.createUserProvider.create({
      ...createUserDto,
      password: hashedPassword,
    });
    return apiResponse({
      message: 'User created successfully',
    });
  }

  async findAll(query: GetAllUsersQueryDto) {
    const { page = 1, limit = 10, search, type = 'manager' } = query;

    const filter: QueryFilter<AdminUser> = { softDeleted: false, type };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const pipeline = [
      {
        $match: filter,
      },
      {
        $lookup: {
          from: 'roles',
          localField: 'role',
          foreignField: '_id',
          as: 'role',
        },
      },
      {
        $unwind: {
          path: '$role',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          'role.name': { $not: /admin/i },
        },
      },
      {
        $project: {
          password: 0,
          softDeleted: 0,
          updatedAt: 0,
          __v: 0,
          'role.softDeleted': 0,
          'role.updatedAt': 0,
          'role.__v': 0,
        },
      },
    ];

    const result = await this.userModel.aggregatePaginate(pipeline, {
      page,
      limit,
    });

    const { docs, ...rest } = result;
    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Users fetched successfully',
    });
  }

  async findAllWithoutPagination() {
    const filter: QueryFilter<AdminUser> = { softDeleted: false };

    const pipeline = [
      {
        $match: filter,
      },
      {
        $lookup: {
          from: 'roles',
          localField: 'role',
          foreignField: '_id',
          as: 'role',
        },
      },
      {
        $unwind: {
          path: '$role',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          'role.name': { $not: /admin/i },
        },
      },
      {
        $project: {
          name: 1,
        },
      },
    ];

    const result = await this.userModel.aggregate(pipeline);

    return apiResponse({
      data: result,
      message: 'Users fetched successfully',
    });
  }

  public async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    try {
      const user = await this.userModel.findById(id).select('-softDeleted');
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return apiResponse({ data: user, message: 'User fetched successfully' });
    } catch (error) {
      throw new RequestTimeoutException(error.message);
    }
  }

  async update(id: string, updateUserDto: UpdateAdminUserDto) {
    if (updateUserDto.password)
      updateUserDto.password = await this.hashingProvider.hashPassword(
        updateUserDto.password,
      );

    const user = await this.userModel.findByIdAndUpdate(id, updateUserDto, {
      new: true,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return apiResponse({ data: user, message: 'User updated successfully' });
  }

  async remove(id: string) {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { softDeleted: true },
      { new: true },
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return apiResponse({ status: true, message: 'User deleted successfully' });
  }
}
