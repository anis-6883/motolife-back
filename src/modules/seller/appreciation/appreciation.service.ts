import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type AggregatePaginateModel, PipelineStage, Types } from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { Appreciation } from 'src/common/models/appreciation.schema';
import { GetAppreciationQueryDto } from './dto/get-appreciations.dto';

@Injectable()
export class AppreciationService {
  constructor(
    @InjectModel(Appreciation.name)
    private readonly appreciationModel: AggregatePaginateModel<Appreciation>,
  ) {}

  async getAppreciations(sellerId: string, query: GetAppreciationQueryDto) {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          seller: new Types.ObjectId(sellerId),
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
