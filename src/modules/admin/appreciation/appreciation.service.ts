import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  type AggregatePaginateModel,
  PipelineStage,
  type PaginateModel,
} from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { CreateAppreciationDto } from './dto/create-appreciation.dto';
import { Seller } from 'src/common/models/seller.schema';
import { Appreciation } from 'src/common/models/appreciation.schema';
import { GetAppreciationQueryDto } from './dto/get-appreciations.dto';

@Injectable()
export class AppreciationService {
  constructor(
    @InjectModel(Seller.name)
    private readonly sellerModel: PaginateModel<Seller>,
    @InjectModel(Appreciation.name)
    private readonly appreciationModel: AggregatePaginateModel<Appreciation>,
  ) {}

  async createAppreciation(createAppreciationDto: CreateAppreciationDto) {
    const sellerExists = await this.sellerModel
      .findById(createAppreciationDto.seller)
      .lean();

    if (!sellerExists) {
      throw new NotFoundException('Seller not found');
    }

    await this.appreciationModel.create(createAppreciationDto);

    return apiResponse({
      status: true,
      message: 'Appreciation created successfully',
    });
  }

  async getAppreciations(sellerId: string, query: GetAppreciationQueryDto) {
    const sellerExists = await this.sellerModel.findById(sellerId);

    if (!sellerExists) {
      throw new NotFoundException('Seller not found');
    }

    const pipeline: PipelineStage[] = [
      {
        $match: {
          seller: sellerExists._id,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ];

    const appreciations = await this.appreciationModel.aggregatePaginate(
      pipeline,
      {
        page: Number(query.page),
        limit: Number(query.limit) > 50 ? 50 : Number(query.limit),
      },
    );

    return apiResponse({
      status: true,
      message: 'Appreciation fetched successfully',
      data: appreciations,
    });
  }
}
