import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PipelineStage,
  Types,
  type AggregatePaginateModel,
  type PaginateModel,
} from 'mongoose';
import { Review } from '../../../common/models/review.schema';
import { apiResponse } from 'src/common/utils/api-response';
import { CreateReviewDto } from './dto/create-review.dto';
import { Product } from 'src/common/models/products.schema';
import { Customer } from 'src/common/models/customers.schema';
import { GetProductReviewDto } from './dto/get-product-review.dto';
import { ComboProduct } from 'src/common/models/combo-products.schema';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: AggregatePaginateModel<Review>,
    @InjectModel(Product.name)
    private readonly productModel: PaginateModel<Product>,
    @InjectModel(ComboProduct.name)
    private readonly comboProductModel: PaginateModel<ComboProduct>,
    @InjectModel(Customer.name)
    private readonly customerModel: PaginateModel<Customer>,
  ) {}

  async createReview(createReviewDto: CreateReviewDto) {
    const session = await this.reviewModel.db.startSession();
    session.startTransaction();

    try {
      const createPayload = { ...createReviewDto };

      const customerExists = await this.customerModel
        .findOne({ phone: createReviewDto.customerPhone })
        .select('_id')
        .session(session);

      if (customerExists) {
        createPayload.customerId = customerExists._id;
      }

      const isCombo = !!createReviewDto.comboProductId;

      const item = isCombo
        ? await this.comboProductModel
            .findById(createReviewDto.comboProductId)
            .session(session)
        : await this.productModel
            .findById(createReviewDto.productId)
            .session(session);

      if (!item) {
        throw new NotFoundException('Product not found');
      }

      createPayload.sellerId = item.seller;

      await this.reviewModel.create([createPayload], { session });

      const matchField = isCombo ? 'comboProductId' : 'productId';
      const [stats] = await this.reviewModel.aggregate(
        [
          {
            $match: {
              [matchField]: item._id,
            },
          },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
            },
          },
        ],
        { session },
      );

      const newRating = stats?.averageRating ?? createReviewDto.rating;

      if (isCombo) {
        await this.comboProductModel
          .findByIdAndUpdate(item._id, { rating: newRating })
          .session(session);
      } else {
        await this.productModel
          .findByIdAndUpdate(item._id, { rating: newRating })
          .session(session);
      }

      await session.commitTransaction();

      return apiResponse({
        status: true,
        message: 'Review created successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async findByProductId(id: string, query: GetProductReviewDto) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');

    const pipeline: PipelineStage[] = [
      {
        $match: {
          productId: new Types.ObjectId(id),
          softDeleted: false,
          willPublish: true,
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer',
          pipeline: [
            {
              $project: {
                _id: 0,
                image: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$customer',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          customerImage: '$customer.image',
        },
      },
      {
        $lookup: {
          from: 'sellers',
          localField: 'replyBy',
          foreignField: '_id',
          as: 'replyBy',
          pipeline: [
            {
              $addFields: {
                storeName: '$store.storeName',
                storeLogo: '$store.logoImage',
              },
            },
            {
              $project: {
                _id: 0,
                storeName: 1,
                storeLogo: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$replyBy',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          customerName: 1,
          customerImage: 1,
          rating: 1,
          review: 1,
          reply: 1,
          images: 1,
          replyBy: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ];

    const result = await this.reviewModel.aggregatePaginate(pipeline, {
      page,
      limit,
    });

    const { docs, ...rest } = result;

    return apiResponse({
      status: true,
      message: 'Review found successfully',
      data: { docs, pagination: rest },
    });
  }

  async findByComboProductId(id: string, query: GetProductReviewDto) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');

    const pipeline: PipelineStage[] = [
      {
        $match: {
          comboProductId: new Types.ObjectId(id),
          softDeleted: false,
          willPublish: true,
        },
      },
      {
        $lookup: {
          from: 'sellers',
          localField: 'replyBy',
          foreignField: '_id',
          as: 'replyBy',
          pipeline: [
            {
              $addFields: {
                storeName: '$store.storeName',
                storeLogo: '$store.logoImage',
              },
            },
            {
              $project: {
                _id: 0,
                storeName: 1,
                storeLogo: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$replyBy',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          customerName: 1,
          rating: 1,
          review: 1,
          reply: 1,
          images: 1,
          replyBy: 1,
        },
      },
    ];

    const result = await this.reviewModel.aggregatePaginate(pipeline, {
      page,
      limit,
    });

    const { docs, ...rest } = result;

    return apiResponse({
      status: true,
      message: 'Review found successfully',
      data: { docs, pagination: rest },
    });
  }
}
