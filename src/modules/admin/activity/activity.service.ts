import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Activity } from '../../../common/models/activity.schema';
import {
  ClientSession,
  PipelineStage,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import { CreateActivityDto } from './dto/create-activity.dto';
import { GetActivityQueryDto } from './dto/get-activity-query.dto';
import { apiResponse } from 'src/common/utils/api-response';

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(Activity.name)
    private readonly activityModel: AggregatePaginateModel<Activity>,
  ) {}

  async createActivity(
    activityData: CreateActivityDto,
    session?: ClientSession,
  ) {
    if (session) {
      return this.activityModel.create([activityData], { session });
    } else {
      return this.activityModel.create(activityData);
    }
  }

  async getActivity(query: GetActivityQueryDto) {
    const { page = 1, limit = 50, action, resourceType, resourceId } = query;

    const pipeline: PipelineStage[] = [
      {
        $match: {
          softDeleted: false,
          ...(action && { action }),
          ...(resourceType && { resourceType }),
          ...(resourceId && { resourceId: new Types.ObjectId(resourceId) }),
        },
      },
      {
        $lookup: {
          from: 'admins',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          softDeleted: 0,
          updatedAt: 0,
        },
      },
    ];

    const result = await this.activityModel.aggregatePaginate(pipeline, {
      page,
      limit: limit > 50 ? 50 : limit,
      sort: { createdAt: -1 },
    });

    const { docs, ...rest } = result;

    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Activities fetched successfully',
    });
  }
}
