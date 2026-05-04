import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PipelineStage,
  QueryFilter,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { GetProductsQueryDto } from '../../../common/dtos/products/get-products-query.dto';
import { Product } from 'src/common/models/products.schema';
import { PRODUCT_STATUS } from 'src/common/enums/products.enum';
import {
  Availability,
  ProductSortFields,
} from 'src/common/enums/customer.enums';
import { RestockRequest } from 'src/common/models/restock-request.schema';
import { RestockRequestDto } from './dtos/restock-request.dto';
import { Offers } from 'src/common/models/offers&deals.schema';
import { FlashSalesQueryDto } from './dtos/get-flash-sales.dto';
import {
  SellerAccountStatus,
  SellerVerificationStatus,
} from 'src/common/enums/seller.enums';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: AggregatePaginateModel<Product>,
    @InjectModel(RestockRequest.name)
    private readonly restockRequestModel: AggregatePaginateModel<RestockRequest>,
    @InjectModel(Offers.name)
    private readonly offersModel: AggregatePaginateModel<Offers>,
  ) {}

  async findAll(query: GetProductsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      brand,
      category,
      subCategory,
      isFeatured,
      isNew,
      availability,
      rating,
      seller,
      fromPrice,
      toPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filters: QueryFilter<Product> = {
      softDeleted: false,
      // isDamaged: false,
    };
    const orFilters: Record<string, unknown>[] = [];

    filters.status = PRODUCT_STATUS.APPROVED;
    filters.isPublished = true;

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

    if (seller) {
      filters.seller = new Types.ObjectId(seller);
    }

    if (isFeatured) {
      filters.isFeatured = isFeatured === 'true';
    }

    if (isNew) {
      filters.isNewArrived = isNew === 'true';
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

    if (orFilters.length) filters['$or'] = orFilters;

    const pipeline: PipelineStage[] = [
      {
        $match: filters,
      },
      {
        $addFields: {
          effectivePrice: {
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ['$variants', []] } }, 0] },
              then: { $arrayElemAt: ['$variants.variantPrice', 0] },
              else: '$sellingPrice',
            },
          },
        },
      },
      {
        $sort: {
          [sortBy === ProductSortFields.PRICE ? 'effectivePrice' : sortBy]:
            sortOrder === 'asc' ? 1 : -1,
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
          pipeline: [
            {
              $project: {
                name: 1,
                logo: 1,
                slug: 1,
                status: 1,
                softDeleted: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'subCategory',
          foreignField: '_id',
          as: 'subCategory',
          pipeline: [
            {
              $project: {
                name: 1,
                logo: 1,
                slug: 1,
                status: 1,
                softDeleted: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$subCategory',
          preserveNullAndEmptyArrays: true,
        },
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
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
          pipeline: [
            {
              $project: {
                name: 1,
                status: 1,
                softDeleted: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$brand',
          preserveNullAndEmptyArrays: true,
        },
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
                'store.storeName': 1,
                'store.logoImage': 1,
                verificationStatus: 1,
                accountStatus: 1,
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
          'category.status': true,
          'category.softDeleted': false,
          'brand.status': true,
          'brand.softDeleted': false,
          $or: [
            { subCategory: { $exists: false } },
            { subCategory: null },
            {
              $and: [
                { 'subCategory.status': true },
                { 'subCategory.softDeleted': false },
              ],
            },
          ],
        },
      },
      {
        $project: {
          softDeleted: 0,
          createdAt: 0,
          updatedAt: 0,
          buyingPrice: 0,
          isDamaged: 0,
          damageType: 0,
          damagePercentage: 0,
          damageDescription: 0,
          'variant.damageType': 0,
          'variant.damagePercentage': 0,
          'variant.damageDescription': 0,
          quantitySold: 0,
          totalOrderAmount: 0,
          'category.status': 0,
          'category.softDeleted': 0,
          'brand.status': 0,
          'brand.softDeleted': 0,
        },
      },
    ];

    const result = await this.productModel.aggregatePaginate(pipeline, {
      page,
      limit,
    });
    const { docs, ...rest } = result;
    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Products fetched successfully',
    });
  }

  async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    const [product] = await this.productModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(id) },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
          pipeline: [
            {
              $project: {
                name: 1,
                logo: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'subCategory',
          foreignField: '_id',
          as: 'subCategory',
          pipeline: [
            {
              $project: {
                name: 1,
                logo: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$subCategory',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
          pipeline: [
            {
              $project: {
                name: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$brand',
          preserveNullAndEmptyArrays: true,
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
          path: '$sellers',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          softDeleted: 0,
          createdAt: 0,
          updatedAt: 0,
          buyingPrice: 0,
          'variant.damageType': 0,
          'variant.damagePercentage': 0,
          'variant.damageDescription': 0,
          isDamaged: 0,
          damageType: 0,
          damageDescription: 0,
          damagePercentage: 0,
          quantitySold: 0,
          totalOrderAmount: 0,
        },
      },
    ]);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return apiResponse({
      data: product,
      message: 'Product fetched successfully',
    });
  }

  async findBySlug(slug: string): Promise<ReturnType<typeof apiResponse>> {
    const [product] = await this.productModel.aggregate([
      {
        $match: { slug: slug },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
          pipeline: [
            {
              $project: {
                name: 1,
                logo: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'subCategory',
          foreignField: '_id',
          as: 'subCategory',
          pipeline: [
            {
              $project: {
                name: 1,
                logo: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$subCategory',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
          pipeline: [
            {
              $project: {
                name: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$brand',
          preserveNullAndEmptyArrays: true,
        },
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
                verificationStatus: 1,
                businessSettings: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$sellers',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'productId',
          as: 'reviews',
          pipeline: [
            {
              $match: { softDeleted: false, willPublish: true },
            },
          ],
        },
      },
      {
        $addFields: {
          reviewCount: {
            $size: '$reviews',
          },
        },
      },
      {
        $project: {
          softDeleted: 0,
          createdAt: 0,
          updatedAt: 0,
          status: 0,
          reviews: 0,
        },
      },
    ]);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return apiResponse({
      data: product,
      message: 'Product fetched successfully',
    });
  }

  async relatedProducts(
    productId: string,
    { page = 0, limit = 10 }: Pick<GetProductsQueryDto, 'page' | 'limit'>,
  ) {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const pipeline: PipelineStage[] = [
      {
        $match: {
          category: product.category,
          _id: { $ne: new Types.ObjectId(productId) },
        },
      },
      {
        $sort: {
          createdAt: -1,
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
          thumbnail: 1,
          seller: 1,
          name: 1,
          slug: 1,
          sellingPrice: 1,
          discountPrice: 1,
          rating: 1,
          discountType: 1,
          discountValue: 1,
          variants: 1,
        },
      },
    ];

    const result = await this.productModel.aggregatePaginate(pipeline, {
      page,
      limit,
    });
    const { docs, ...rest } = result;

    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Related products fetched successfully',
    });
  }

  async requestRestock(requestDto: RestockRequestDto) {
    const { productId, variantRequest } = requestDto;

    const product = await this.productModel.exists({ _id: productId });
    if (!product) throw new NotFoundException('Product not found');

    if (variantRequest?.sku) {
      const variant = await this.productModel.findOne({
        _id: productId,
        'variants.sku': variantRequest.sku,
      });
      if (!variant) throw new NotFoundException('Variant not found');
    }

    if (variantRequest?.sku) {
      let result = await this.restockRequestModel.findOneAndUpdate(
        { productId: productId, 'variantRequests.sku': variantRequest.sku },
        {
          $inc: { totalRequests: 1, 'variantRequests.$.requests': 1 },
        },
        { new: true },
      );

      if (!result) {
        result = await this.restockRequestModel.findOneAndUpdate(
          { productId: productId },
          {
            $inc: { totalRequests: 1 },
            $push: {
              variantRequests: { sku: variantRequest.sku, requests: 1 },
            },
          },
          { upsert: true, new: true },
        );
      }

      return apiResponse({
        message: 'Variant restock request tracked',
      });
    }

    const globalResult = await this.restockRequestModel.findOneAndUpdate(
      { productId: productId },
      { $inc: { totalRequests: 1 } },
      { upsert: true, new: true },
    );

    return apiResponse({
      message: 'General restock request tracked',
    });
  }

  async getFlashSales(query: FlashSalesQueryDto) {
    const { page = 0, limit = 10, status } = query;
    const filters: QueryFilter<Offers> = {
      title: {
        $regex: 'flash',
        $options: 'i',
      },
      softDeleted: false,
      status: true,
    };

    const pipeline: PipelineStage[] = [
      {
        $match: filters,
      },

      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'products',
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
                      image: 1,
                    },
                  },
                ],
              },
            },
            {
              $unwind: '$seller',
            },
            {
              $project: {
                searchTags: 0,
                softDeleted: 0,
                status: 0,
                variants: 0,
                sizeGuide: 0,
                videoLinks: 0,
                benefits: 0,
                images: 0,
                brand: 0,
                buyingPrice: 0,
                __v: 0,
                createdAt: 0,
                updatedAt: 0,
              },
            },
          ],
        },
      },
      // {
      //   $addFields: {
      //     items: {
      //       $map: {
      //         input: '$items',
      //         as: 'item',
      //         in: {
      //           $mergeObjects: [
      //             '$$item',
      //             {
      //               seller: {
      //                 $let: {
      //                   vars: {
      //                     matchedSeller: {
      //                       $arrayElemAt: [
      //                         {
      //                           $filter: {
      //                             input: '$sellerDetails',
      //                             as: 'seller',
      //                             cond: {
      //                               $eq: ['$$seller._id', '$$item.seller'],
      //                             },
      //                           },
      //                         },
      //                         0,
      //                       ],
      //                     },
      //                   },
      //                   in: { name: '$$matchedSeller.name' },
      //                 },
      //               },
      //             },
      //           ],
      //         },
      //       },
      //     },
      //   },
      // },
      {
        $project: {
          items: 0,
          softDeleted: 0,
          createdAt: 0,
          updatedAt: 0,
        },
      },
    ];

    const result = await this.offersModel.aggregatePaginate(pipeline, {
      page,
      limit: limit > 50 ? 50 : limit,
    });

    const { docs, ...rest } = result;

    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Flash sales fetched successfully',
    });
  }
}
