import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PipelineStage,
  QueryFilter,
  type AggregatePaginateModel,
} from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { ReplyDto, UpdateDisputeDto } from './dto/update-dispute.dto';
import { Seller } from 'src/common/models/seller.schema';
import { Dispute } from 'src/common/models/dispute.schema';
import { GetDisputeQueryDto } from './dto/get-dispute-query.dto';

@Injectable()
export class DisputeService {
  constructor(
    @InjectModel(Dispute.name)
    private readonly disputeModel: AggregatePaginateModel<Dispute>,
    @InjectModel(Seller.name)
    private readonly sellerModel: AggregatePaginateModel<Seller>,
  ) {}

  async findAll(query: GetDisputeQueryDto) {
    const { page = 1, limit = 10, search } = query;

    const filters: QueryFilter<Dispute> = { softDeleted: false };

    if (search) {
      filters.subject = { $regex: search, $options: 'i' };
    }

    const pipeline: PipelineStage[] = [
      {
        $match: filters,
      },
    ];

    const result = await this.disputeModel.aggregatePaginate(pipeline, {
      page,
      limit: limit > 50 ? 50 : limit,
    });

    const { docs, ...rest } = result;

    return apiResponse({ data: docs, pagination: rest });
  }

  async update(id: string, updateDisputeDto: UpdateDisputeDto) {
    const updatedDispute = await this.disputeModel.findByIdAndUpdate(
      id,
      updateDisputeDto,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedDispute) {
      throw new NotFoundException('Dispute not found');
    }
    return apiResponse({
      message: 'Dispute updated successfully',
    });
  }

  async addReply(id: string, replyDto: ReplyDto) {
    replyDto.replyBy = 'admin';
    const updatedDispute = await this.disputeModel.findByIdAndUpdate(
      id,
      {
        $push: {
          replies: replyDto,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );
    if (!updatedDispute) {
      throw new NotFoundException('Dispute not found');
    }
    return apiResponse({
      message: 'Reply added successfully',
    });
  }

  async remove(id: string) {
    const deletedDispute = await this.disputeModel.findByIdAndUpdate(
      id,
      {
        softDeleted: true,
      },
      { new: true },
    );

    if (!deletedDispute) {
      throw new NotFoundException('Dispute not found');
    }
    return apiResponse({
      status: true,
      message: 'Dispute deleted successfully',
    });
  }
}
