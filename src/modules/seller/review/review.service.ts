import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Model,
  PipelineStage,
  QueryFilter,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import { Review } from '../../../common/models/review.schema';
import { apiResponse } from 'src/common/utils/api-response';
import { GetReviewsQueryDto } from './dto/get-review-query.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { IActiveUser } from '../auth/interfaces/active-user.interface';
import { BusinessSettings } from 'src/common/models/business-settings.schema';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: AggregatePaginateModel<Review>,
    @InjectModel(BusinessSettings.name)
    private readonly businessSettingsModel: Model<BusinessSettings>,
  ) {}

  async findAll(query: GetReviewsQueryDto, user: IActiveUser) {
    const {
      page = 1,
      limit = 10,
      search,
      productId,
      customerId,
      rating,
      date,
    } = query;

    const filters: QueryFilter<Review> = {
      softDeleted: false,
      sellerId: new Types.ObjectId(user.sub),
    };

    if (search) {
      filters.review = { $regex: search, $options: 'i' };
    }

    if (productId) {
      filters.productId = productId;
    }

    if (customerId) {
      filters.customerId = customerId;
    }

    if (rating) {
      filters.rating = rating;
    }

    if (date) {
      if (date === 'week') {
        filters.createdAt = {
          $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        };
      } else if (date === 'month') {
        filters.createdAt = {
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        };
      } else {
        filters.createdAt = {
          $gte: new Date(date),
          $lt: new Date(date + 'T23:59:59.999Z'),
        };
      }
    }

    const pipeline: PipelineStage[] = [
      {
        $match: filters,
      },
    ];

    const result = await this.reviewModel.aggregatePaginate(pipeline, {
      page,
      limit,
    });
    const { docs, ...rest } = result;

    return apiResponse({ data: docs, pagination: rest });
  }

  async update(
    id: string,
    updateReviewDto: UpdateReviewDto,
    user: IActiveUser,
  ) {
    if (updateReviewDto.reply) {
      const vendorSettings = await this.businessSettingsModel
        .findOne({})
        .select('vendor')
        .lean();

      if (!vendorSettings?.vendor?.canReplyOnReview) {
        throw new BadRequestException('You can not reply on review');
      }
    }

    if (updateReviewDto.reply) {
      updateReviewDto.replyBy = new Types.ObjectId(user.sub);
    }

    const updatedReview = await this.reviewModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        sellerId: new Types.ObjectId(user.sub),
      },
      updateReviewDto,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedReview) {
      throw new NotFoundException('Review not found');
    }
    return apiResponse({
      message: 'Review updated successfully',
    });
  }

  async remove(id: string, user: IActiveUser) {
    const deletedReview = await this.reviewModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        sellerId: new Types.ObjectId(user.sub),
      },
      {
        softDeleted: true,
      },
      { new: true },
    );

    if (!deletedReview) {
      throw new NotFoundException('Review not found');
    }

    return apiResponse({
      status: true,
      message: 'Review deleted successfully',
    });
  }
}
