import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBenefitsDto } from './dto/create-benefit.dto';
import { UpdateBenefitsDto } from './dto/update-benefit.dto';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, type PaginateModel } from 'mongoose';
import { Benefits } from '../../../common/models/benefits.schema';
import { apiResponse } from 'src/common/utils/api-response';
import { GetBenefitsQueryDto } from './dto/get-benefits-query.dto';
import { Product } from 'src/common/models/products.schema';

@Injectable()
export class BenefitsService {
  constructor(
    @InjectModel(Benefits.name)
    private readonly benefitsModel: PaginateModel<Benefits>,
    @InjectModel(Product.name)
    private readonly productsModel: PaginateModel<Product>,
  ) {}

  async create(createBenefitsDto: CreateBenefitsDto) {
    await this.benefitsModel.create(createBenefitsDto);
    return apiResponse({
      message: 'Benefits created successfully',
    });
  }

  async findAll(query: GetBenefitsQueryDto) {
    const { search, page = 1, limit = 10, status, p } = query;

    const filters: QueryFilter<Benefits> = { softDeleted: false };

    if (search) {
      filters.title = { $regex: search, $options: 'i' };
    }

    if (status) {
      filters.status = status === 'true';
    }

    if (p === 'false') {
      const benefits = await this.benefitsModel
        .find(filters)
        .select('-softDeleted -createdAt');

      return apiResponse({
        data: benefits,
        message: 'Benefits fetched successfully',
      });
    }

    const result = await this.benefitsModel.paginate(filters, {
      page,
      limit: limit > 50 ? 50 : limit,
      sort: {
        createdAt: -1,
      },
      select: '-softDeleted -createdAt',
    });

    const { docs, ...rest } = result;

    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Benefits fetched successfully',
    });
  }

  public async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    const benefits = await this.benefitsModel
      .findById(id)
      .select('-softDeleted -createdAt');

    if (!benefits) {
      throw new NotFoundException('Benefits not found');
    }

    return apiResponse({
      data: benefits,
      message: 'Benefits fetched successfully',
    });
  }

  async update(id: string, updateBenefitsDto: UpdateBenefitsDto) {
    const updatedBenefits = await this.benefitsModel.findByIdAndUpdate(
      id,
      updateBenefitsDto,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedBenefits) {
      throw new NotFoundException('Benefits not found');
    }
    return apiResponse({
      data: updatedBenefits,
      message: 'Benefits updated successfully',
    });
  }

  async remove(id: string) {
    const deletedBenefits = await this.benefitsModel.findByIdAndUpdate(id, {
      softDeleted: true,
    });

    if (!deletedBenefits) {
      throw new NotFoundException('Benefits not found');
    }

    await this.productsModel.updateMany(
      { benefit: deletedBenefits._id },
      { benefit: null },
    );

    return apiResponse({
      status: true,
      message: 'Benefits deleted successfully',
    });
  }

  async updateStatus(id: string, status: boolean) {
    const updatedBenefits = await this.benefitsModel.findByIdAndUpdate(
      id,
      { status },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedBenefits) {
      throw new NotFoundException('Benefits not found');
    }
    return apiResponse({
      data: updatedBenefits,
      message: 'Benefits status updated successfully',
    });
  }
}
