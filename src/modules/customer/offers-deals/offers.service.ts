import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PipelineStage,
  QueryFilter,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { GetOffersQueryDto } from './dto/get-offers-query.dto';
import { Offers } from 'src/common/models/offers&deals.schema';
import { GetOfferItemsQueryDto } from './dto/get-offer-items-query.dto';
import {
  Availability,
  ProductSortFields,
} from 'src/common/enums/customer.enums';
import { Product } from 'src/common/models/products.schema';
import { PRODUCT_STATUS } from 'src/common/enums/products.enum';
@Injectable()
export class OffersService {
  constructor(
    @InjectModel(Offers.name)
    private readonly offersModel: AggregatePaginateModel<Offers>,
  ) {}

  async getFlashSale() {
    const filters: QueryFilter<Offers> = { softDeleted: false, status: true };

    filters.title = { $regex: 'flash', $options: 'i' };

    const pipeline: PipelineStage[] = [
      {
        $match: filters,
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'populatedProducts',
          pipeline: [
            {
              $lookup: {
                from: 'sellers',
                localField: 'seller',
                foreignField: '_id',
                as: 'seller',
                pipeline: [
                  {
                    $project: {
                      name: 1,
                      'store.storeName': 1,
                      'store.storeImage': 1,
                      verificationStatus: 1,
                    },
                  },
                ],
              },
            },
            {
              $project: {
                name: 1,
                thumbnail: 1,
                discountType: 1,
                discountValue: 1,
                discountPrice: 1,
                sellingPrice: 1,
                seller: 1,
                status: 1,
                rating: 1,
                slug: 1,
              },
            },
          ],
        },
      },
      {
        $set: {
          items: '$populatedProducts',
        },
      },
      {
        $project: {
          softDeleted: 0,
          updatedAt: 0,
          populatedProducts: 0,
        },
      },
    ];

    const result = await this.offersModel.aggregate(pipeline);

    return apiResponse({
      data: result?.[0],
      message: 'Flash sales fetched successfully',
    });
  }

  async findOffer(query: GetOffersQueryDto) {
    const { resourceType, title, page = 1, limit = 50 } = query;
    const safeLimit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * safeLimit;

    const filters: QueryFilter<Offers> = { softDeleted: false };

    if (resourceType) {
      filters.resourceType = resourceType;
    }

    if (title) {
      filters.title = { $regex: title, $options: 'i' };
    }

    const pipeline: PipelineStage[] = [
      {
        $match: filters,
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'populatedProducts',
          pipeline: [
            {
              $match: {
                softDeleted: false,
                isDamaged: false,
                isPublished: true,
                status: PRODUCT_STATUS.APPROVED,
              },
            },
            {
              $lookup: {
                from: 'sellers',
                localField: 'seller',
                foreignField: '_id',
                as: 'seller',
                pipeline: [
                  {
                    $project: {
                      name: 1,
                      'store.storeName': 1,
                      'store.storeImage': 1,
                      verificationStatus: 1,
                    },
                  },
                ],
              },
            },
            {
              $project: {
                name: 1,
                thumbnail: 1,
                variants: 1,
                discountType: 1,
                discountValue: 1,
                discountPrice: 1,
                sellingPrice: 1,
                stockQuantity: 1,
                seller: 1,
                status: 1,
                rating: 1,
                isFeatured: 1,
                isNewArrived: 1,
                isUpcoming: 1,
                hasOffer: 1,
                isLimited: 1,
                slug: 1,
              },
            },
            { $skip: skip },
            { $limit: safeLimit },
          ],
        },
      },
      {
        $set: {
          items: '$populatedProducts',
        },
      },
      {
        $project: {
          softDeleted: 0,
          updatedAt: 0,
          populatedProducts: 0,
        },
      },
    ];

    const result = await this.offersModel.aggregate(pipeline);

    return apiResponse({
      data: result[0],
      message: 'Offers fetched successfully',
    });
  }

  async findOfferItems(slug: string, query: GetOfferItemsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      brand,
      category,
      isFeatured,
      isPublished,
      subCategory,
      availability,
      rating,
      fromPrice,
      toPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const safeLimit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * safeLimit;

    const offer = await this.offersModel.findOne({ slug }).lean();
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    const totalDocs = offer.items?.length || 0;
    const totalPages = Math.ceil(totalDocs / safeLimit) || 1;

    const filters: QueryFilter<Product> = {
      softDeleted: false,
      isDamaged: false,
      isPublished: true,
      status: PRODUCT_STATUS.APPROVED,
    };
    const orFilters: Record<string, unknown>[] = [];

    if (search) {
      orFilters.push(
        ...[
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { searchTags: search },
        ],
      );
    }

    if (brand) {
      filters.brand = {
        $in: brand.split(',').map((b) => new Types.ObjectId(b.trim())),
      };
    }

    if (isFeatured) {
      filters.isFeatured = isFeatured === 'true';
    }

    if (availability) {
      const availabilityList = availability.split(',').map((a) => a.trim());

      if (availabilityList.includes(Availability.INSTOCK)) {
        orFilters.push({ stockQuantity: { $gt: 0 } });
      }

      if (availabilityList.includes(Availability.OUTOFSTOCK)) {
        orFilters.push({ stockQuantity: { $lte: 0 } });
      }

      if (availabilityList.includes(Availability.UPCOMING)) {
        orFilters.push({ isUpcoming: true });
      }
    }

    if (fromPrice && toPrice) {
      filters.sellingPrice = { $gte: Number(fromPrice), $lte: Number(toPrice) };
    }

    if (rating) {
      const ratingFilters = rating.split(',').map((r) => {
        const floor = Number(r.trim());
        return {
          rating: { $gte: floor, $lt: floor + 1 },
        };
      });

      if (ratingFilters.length === 1) {
        Object.assign(filters, ratingFilters[0]);
      } else {
        orFilters.push(...ratingFilters);
      }
    }

    // if (rating) {
    //   filters.rating = { $in: rating.split(',').map((r) => Number(r.trim())) };
    // }

    if (orFilters.length) filters['$or'] = orFilters;

    const pipeline: PipelineStage[] = [
      { $match: { slug: slug } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productData',
        },
      },
      { $unwind: '$productData' },
      { $replaceRoot: { newRoot: '$productData' } },
      { $match: filters },
      {
        $sort: {
          [sortBy === ProductSortFields.PRICE ? 'sellingPrice' : sortBy]:
            sortOrder === 'asc' ? 1 : -1,
        },
      },
      {
        $lookup: {
          from: 'sellers',
          localField: 'seller',
          foreignField: '_id',
          as: 'seller',
          pipeline: [
            {
              $project: {
                name: 1,
                'store.storeName': 1,
                'store.storeImage': 1,
                verificationStatus: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: { path: '$seller', preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      {
        $unwind: { path: '$brand', preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
          pipeline: [{ $project: { name: 1, logo: 1 } }],
        },
      },
      {
        $unwind: { path: '$category', preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'subCategory',
          foreignField: '_id',
          as: 'subCategory',
          pipeline: [{ $project: { name: 1, logo: 1 } }],
        },
      },
      {
        $unwind: { path: '$subCategory', preserveNullAndEmptyArrays: true },
      },
      {
        $match: {
          ...(category && {
            $or: [
              { 'category.slug': { $regex: category, $options: 'i' } },
              { 'category.name': { $regex: category, $options: 'i' } },
            ],
          }),
          ...(subCategory && {
            $or: [
              { 'subCategory.slug': { $regex: subCategory, $options: 'i' } },
              { 'subCategory.name': { $regex: subCategory, $options: 'i' } },
            ],
          }),
        },
      },
      {
        $lookup: {
          from: 'benefits',
          localField: 'benefits',
          foreignField: '_id',
          as: 'benefits',
          pipeline: [{ $project: { title: 1, benefits: 1 } }],
        },
      },
      {
        $unwind: { path: '$benefits', preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          buyingPrice: 0,
          softDeleted: 0,
          createdAt: 0,
          updatedAt: 0,
          isDamaged: 0,
          totalOrderAmount: 0,
          quantitySold: 0,
          status: 0,
        },
      },
      { $skip: skip },
      { $limit: safeLimit },
    ];

    const docs = await this.offersModel.aggregate(pipeline);

    const pagingCounter = skip + 1;
    const hasPrevPage = page > 1;
    const hasNextPage = page < totalPages;

    return apiResponse({
      data: {
        docs,
        pagination: {
          totalDocs,
          limit: safeLimit,
          page,
          totalPages,
          pagingCounter,
          hasPrevPage,
          hasNextPage,
          prevPage: hasPrevPage ? page - 1 : null,
          nextPage: hasNextPage ? page + 1 : null,
        },
      },
      message: 'Products fetched successfully',
    });
  }

  public async findBySlug(
    slug: string,
  ): Promise<ReturnType<typeof apiResponse>> {
    const offers = await this.offersModel
      .findOne({
        slug: slug,
      })
      .select('-items -softDeleted -status')
      .lean();

    if (!offers) {
      throw new NotFoundException('Offers not found');
    }
    return apiResponse({
      data: offers,
      message: 'Offers fetched successfully',
    });
  }
}
