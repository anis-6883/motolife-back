import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PipelineStage,
  QueryFilter,
  type AggregatePaginateModel,
} from 'mongoose';
import { Brand } from '../../../common/models/brand.schema';
import { apiResponse } from 'src/common/utils/api-response';
import { GetBrandsQueryDto } from './dto/get-brands-query.dto';

@Injectable()
export class BrandService {
  constructor(
    @InjectModel(Brand.name)
    private readonly brandModel: AggregatePaginateModel<Brand>,
  ) {}

  async findAll(query: GetBrandsQueryDto) {
    const { search, status } = query;

    const filters: QueryFilter<Brand> = { softDeleted: false, status: true };

    if (search) {
      filters.name = { $regex: search, $options: 'i' };
    }

    //customer only show active brands

    // if (status) {
    //   filters.status = status as boolean;
    // }

    const pipeline: PipelineStage[] = [
      {
        $match: filters,
      },
      {
        $sort: { position: 1 },
      },
      {
        $project: {
          position: 0,
          updatedAt: 0,
          softDeleted: 0,
          createdAt: 0,
        },
      },
    ];

    const result = await this.brandModel.aggregate(pipeline);

    return apiResponse({
      data: result,
      message: 'Brands fetched successfully',
    });
  }

  public async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    const brand = await this.brandModel
      .findById(id)
      .select('-softDeleted -updatedAt -createdAt');
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    return apiResponse({ data: brand, message: 'Brand fetched successfully' });
  }
}
