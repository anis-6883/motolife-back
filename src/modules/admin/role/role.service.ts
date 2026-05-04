import {
  Injectable,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectModel } from '@nestjs/mongoose';
import { PipelineStage, Types, type AggregatePaginateModel } from 'mongoose';
import { Role } from '../../../common/models/role.schema';
import { apiResponse } from 'src/common/utils/api-response';
import { GetRolesQueryDto } from './dto/get-role-query.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(Role.name)
    private readonly roleModel: AggregatePaginateModel<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const createdRole = await this.roleModel.create(createRoleDto);
    return apiResponse({
      message: 'Role created successfully',
    });
  }

  async findAll(query: GetRolesQueryDto) {
    const { page = 1, limit = 10, search } = query;

    const matchConditions: any[] = [
      { softDeleted: false },
      { name: { $not: /admin/i } },
    ];

    if (search) {
      matchConditions.push({ name: { $regex: search, $options: 'i' } });
    }

    const pipeline: PipelineStage[] = [
      {
        $match: {
          $and: matchConditions,
        },
      },
      // {
      //   $project: {
      //     _id: 1,
      //     name: 1,
      //     permissions: 1,
      //     status: 1,
      //   },
      // },
    ];

    const result = await this.roleModel.aggregatePaginate(pipeline, {
      page,
      limit: limit > 50 ? 50 : limit,
      sort: { createdAt: -1 },
    });

    const { docs, ...rest } = result;

    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Roles fetched successfully',
    });
  }

  public async findById(
    id: string | Types.ObjectId,
  ): Promise<ReturnType<typeof apiResponse>> {
    try {
      const role = await this.roleModel.findById(id).select('-softDeleted');
      if (!role) {
        throw new NotFoundException('Role not found');
      }
      return apiResponse({ data: role, message: 'Role fetched successfully' });
    } catch (error) {
      throw new RequestTimeoutException(error.message);
    }
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const updatedRole = await this.roleModel.findByIdAndUpdate(
      id,
      updateRoleDto,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedRole) {
      throw new NotFoundException('Role not found');
    }
    return apiResponse({
      data: updatedRole,
      message: 'Role updated successfully',
    });
  }

  async remove(id: string) {
    const deletedRole = await this.roleModel.findByIdAndUpdate(id, {
      softDeleted: true,
    });
    if (!deletedRole) {
      throw new NotFoundException('Role not found');
    }
    return apiResponse({ status: true, message: 'Role deleted successfully' });
  }

  async updateStatus(id: string, { status }: { status: boolean }) {
    const updatedRole = await this.roleModel.findByIdAndUpdate(
      id,
      { status },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedRole) {
      throw new NotFoundException('Role not found');
    }
    return apiResponse({
      data: updatedRole,
      message: 'Role status updated successfully',
    });
  }
}
