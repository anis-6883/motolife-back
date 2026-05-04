import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PipelineStage,
  QueryFilter,
  type AggregatePaginateModel,
} from 'mongoose';
import { Review } from '../../../common/models/review.schema';
import { apiResponse } from 'src/common/utils/api-response';
import { GetReviewsQueryDto } from './dto/get-review-query.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Seller } from 'src/common/models/seller.schema';
import { ShopType } from 'src/common/enums/seller.enums';
import { CreateReviewDto } from './dto/create-review.dto';
import { Product } from 'src/common/models/products.schema';
import { ComboProduct } from 'src/common/models/combo-products.schema';
import { Customer } from 'src/common/models/customers.schema';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: AggregatePaginateModel<Review>,
    @InjectModel(Seller.name)
    private readonly sellerModel: AggregatePaginateModel<Seller>,
    @InjectModel(Customer.name)
    private readonly customerModel: AggregatePaginateModel<Seller>,
    @InjectModel(Product.name)
    private readonly productModel: AggregatePaginateModel<Product>,
    @InjectModel(ComboProduct.name)
    private readonly comboProductModel: AggregatePaginateModel<ComboProduct>,
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
              willPublish: true,
              softDeleted: false,
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

  async findAll(query: GetReviewsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      productId,
      customerId,
      sellerId,
      rating,
      date,
      willPublish,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filters: QueryFilter<Review> = { softDeleted: false };

    if (productId) {
      filters.productId = productId;
    }

    if (customerId) {
      filters.customerId = customerId;
    }

    if (sellerId) {
      filters.sellerId = sellerId;
    }

    if (rating) {
      filters.rating = Number(rating);
    }

    if (willPublish) {
      filters.willPublish = willPublish === 'true';
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
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                thumbnail: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$product',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'combo_products',
          localField: 'comboProductId',
          foreignField: '_id',
          as: 'comboProduct',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                thumbnail: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$comboProduct',
          preserveNullAndEmptyArrays: true,
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
      ...(search
        ? [
            {
              $match: {
                $or: [
                  {
                    customerName: {
                      $regex: search,
                      $options: 'i',
                    },
                  },
                  {
                    'product.name': {
                      $regex: search,
                      $options: 'i',
                    },
                  },
                  {
                    'comboProduct.name': {
                      $regex: search,
                      $options: 'i',
                    },
                  },
                  {
                    reviewId: {
                      $regex: search,
                      $options: 'i',
                    },
                  },
                ],
              },
            },
          ]
        : []),
      {
        $project: {
          customerName: 1,
          customerImage: 1,
          rating: 1,
          review: 1,
          reply: 1,
          images: 1,
          replyBy: 1,
          product: 1,
          sellerId: 1,
          comboProduct: 1,
          createdAt: 1,
          willPublish: 1,
        },
      },
      {
        $sort: {
          [sortBy]: sortOrder === 'asc' ? 1 : -1,
        },
      },
    ];

    const result = await this.reviewModel.aggregatePaginate(pipeline, {
      page,
      limit: limit > 50 ? 50 : limit,
    });

    const { docs, ...rest } = result;

    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Reviews fetched successfully',
    });
  }

  async update(id: string, updateReviewDto: UpdateReviewDto) {
    const session = await this.reviewModel.db.startSession();
    session.startTransaction();

    try {
      const reviewExists = await this.reviewModel.findById(id).session(session);
      if (!reviewExists) {
        throw new NotFoundException('Review not found');
      }

      const payload = Object.fromEntries(
        Object.entries(updateReviewDto).filter(([_, v]) => v !== undefined),
      );

      if (payload.reply) {
        const seller = await this.sellerModel
          .findOne({ shopType: ShopType.INHOUSE })
          .session(session);

        if (!seller) {
          throw new NotFoundException('Seller not found');
        }

        payload.replyBy = seller._id;
      }

      const updatedReview = await this.reviewModel.findByIdAndUpdate(
        id,
        payload,
        {
          new: true,
          runValidators: true,
          session,
        },
      );

      if (!updatedReview) {
        throw new NotFoundException('Review not found');
      }

      const matchField = reviewExists.comboProductId
        ? 'comboProductId'
        : 'productId';

      const matchValue = reviewExists[matchField];

      const [stats] = await this.reviewModel.aggregate(
        [
          {
            $match: {
              [matchField]: matchValue,
              willPublish: true,
              softDeleted: false,
            },
          },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              totalReviews: { $sum: 1 },
            },
          },
        ],
        { session },
      );

      const newRating = stats?.averageRating ?? 0;
      const totalReviews = stats?.totalReviews ?? 0;

      const updatePayload = {
        rating: newRating,
        totalReviews,
      };

      if (reviewExists.comboProductId) {
        await this.comboProductModel.findByIdAndUpdate(
          reviewExists.comboProductId,
          updatePayload,
          { new: true, session },
        );
      } else {
        await this.productModel.findByIdAndUpdate(
          reviewExists.productId,
          updatePayload,
          { new: true, session },
        );
      }

      await session.commitTransaction();

      return apiResponse({
        message: 'Review updated successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async remove(id: string) {
    const deletedReview = await this.reviewModel.findByIdAndUpdate(
      id,
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
