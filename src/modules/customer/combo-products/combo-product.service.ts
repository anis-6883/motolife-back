import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PipelineStage,
  QueryFilter,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { ComboProduct } from 'src/common/models/combo-products.schema';
import { GetComboProductsQueryDto } from 'src/common/dtos/combo-products/get-combo-products-query.dto';
import {
  Availability,
  ProductSortFields,
} from 'src/common/enums/customer.enums';
import {
  SellerAccountStatus,
  SellerVerificationStatus,
} from 'src/common/enums/seller.enums';
import { ComboBanner } from 'src/common/models/combo-banner';

@Injectable()
export class ComboProductService {
  constructor(
    @InjectModel(ComboProduct.name)
    private readonly productModel: AggregatePaginateModel<ComboProduct>,
    @InjectModel(ComboBanner.name)
    private readonly comboBannerModel: AggregatePaginateModel<ComboBanner>,
  ) {}

  async findAll(query: GetComboProductsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      isFeatured,
      isPublished,
      isNew,
      availability,
      rating,
      status,
      seller,
      fromPrice,
      toPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filters: QueryFilter<ComboProduct> = {
      softDeleted: false,
      isPublished: true,
    };
    const orFilters: Record<string, unknown>[] = [];

    if (search) {
      filters.name = { $regex: search, $options: 'i' };
    }

    if (seller) {
      filters.seller = new Types.ObjectId(seller);
    }

    if (isFeatured) {
      filters.isFeatured = isFeatured === 'true';
    }

    if (isPublished) {
      filters.isPublished = isPublished === 'true';
    }

    if (isNew) {
      filters.isNewArrived = isNew === 'true';
    }

    if (fromPrice && toPrice) {
      filters.sellingPrice = { $gte: Number(fromPrice), $lte: Number(toPrice) };
    }

    if (rating) {
      filters.rating = { $in: rating.split(',').map((r) => Number(r.trim())) };
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

    if (orFilters.length) filters['$or'] = orFilters;

    const pipeline: PipelineStage[] = [
      {
        $match: filters,
      },
      {
        $sort: {
          [sortBy === ProductSortFields.PRICE ? 'sellingPrice' : sortBy]:
            sortOrder === 'asc' ? 1 : -1,
        },
      },
      {
        $lookup: {
          from: 'benefits',
          localField: 'benefits',
          foreignField: '_id',
          as: 'benefits',
          pipeline: [
            {
              $project: {
                title: 1,
                benefits: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$benefits',
          preserveNullAndEmptyArrays: true,
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
              $match: {
                accountStatus: {
                  $in: [
                    SellerAccountStatus.LIVE,
                    SellerAccountStatus.INACTIVE,
                    SellerAccountStatus.ON_VACATION,
                  ],
                },
                verificationStatus: {
                  $ne: SellerVerificationStatus.REJECTED,
                },
              },
            },
            {
              $project: {
                fullName: 1,
                image: 1,
                phone: 1,
                'store.storeName': 1,
                'store.address': 1,
                'store.logoImage': 1,
                accountStatus: 1,
                verificationStatus: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$seller',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          seller: { $ne: null },
        },
      },
      {
        $project: {
          softDeleted: 0,
          createdAt: 0,
          updatedAt: 0,
          buyingPrice: 0,
          quantitySold: 0,
          totalOrderAmount: 0,
        },
      },
    ];

    const result = await this.productModel.aggregatePaginate(pipeline, {
      page,
      limit,
    });
    const { docs, ...rest } = result;

    const comboBannerData = await this.getComboBanner();

    return apiResponse({
      data: {
        ...(comboBannerData?.data && {
          comboBanner: (comboBannerData?.data as ComboBanner)?.image,
        }),
        docs,
        pagination: rest,
      },
      message: 'Combo products fetched successfully',
    });
  }

  async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    const [product] = await this.productModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(id) },
      },
      {
        $lookup: {
          from: 'benefits',
          localField: 'benefit',
          foreignField: '_id',
          as: 'benefit',
          pipeline: [
            {
              $project: {
                title: 1,
                benefits: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$benefit',
          preserveNullAndEmptyArrays: true,
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
                fullName: 1,
                image: 1,
                phone: 1,
                'store.storeName': 1,
                'store.address': 1,
                'store.logoImage': 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$seller',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          softDeleted: 0,
          createdAt: 0,
          updatedAt: 0,
          buyingPrice: 0,
          quantitySold: 0,
          totalOrderAmount: 0,
        },
      },
    ]);
    if (!product) {
      throw new NotFoundException('Combo product not found.');
    }
    return apiResponse({
      data: product,
      message: 'Combo product fetched successfully',
    });
  }

  async findBySlug(slug: string): Promise<ReturnType<typeof apiResponse>> {
    const [product] = await this.productModel.aggregate([
      {
        $match: { slug: slug },
      },
      {
        $lookup: {
          from: 'benefits',
          localField: 'benefits',
          foreignField: '_id',
          as: 'benefits',
          pipeline: [
            {
              $project: {
                title: 1,
                benefits: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$benefits',
          preserveNullAndEmptyArrays: true,
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
                fullName: 1,
                image: 1,
                phone: 1,
                'store.storeName': 1,
                'store.address': 1,
                'store.logoImage': 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$seller',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          softDeleted: 0,
          createdAt: 0,
          updatedAt: 0,
          buyingPrice: 0,
          quantitySold: 0,
          totalOrderAmount: 0,
        },
      },
    ]);
    if (!product) {
      throw new NotFoundException('Combo product not found.');
    }
    return apiResponse({
      data: product,
      message: 'Combo product fetched successfully',
    });
  }

  async getComboBanner() {
    const comboBanner = await this.comboBannerModel
      .find({
        softDeleted: false,
        status: true,
      })
      .lean();

    return apiResponse({
      data: comboBanner?.length > 0 ? comboBanner[0] : null,
      message: 'Combo banner fetched successfully',
    });
  }
}
