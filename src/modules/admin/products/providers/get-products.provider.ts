import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Model,
  PipelineStage,
  QueryFilter,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { Product } from 'src/common/models/products.schema';
import { GetProductsQueryDto } from 'src/common/dtos/products/get-products-query.dto';
import { ProductSortFields } from 'src/common/enums/customer.enums';
import { Seller } from 'src/common/models/seller.schema';
import { ShopType } from 'src/common/enums/seller.enums';
import { PRODUCT_STATUS } from 'src/common/enums/products.enum';

@Injectable()
export class GetProductProvider {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: AggregatePaginateModel<Product>,
    @InjectModel(Seller.name)
    private readonly sellerModel: Model<Seller>,
  ) {}

  async findAllInhouse(query: GetProductsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      brand,
      category,
      isFeatured,
      isPublished,
      isNew,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isDamaged,
    } = query;

    const filters: QueryFilter<Product> = { softDeleted: false };

    const inhouseSellers = await this.sellerModel
      .find({ shopType: ShopType.INHOUSE })
      .select('_id');

    const sellerIds = inhouseSellers.map((s) => s._id);

    filters.seller = { $in: sellerIds };

    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { productId: { $regex: search, $options: 'i' } },
      ];
    }

    if (brand) {
      filters.brand = new Types.ObjectId(brand);
    }

    if (category) {
      filters.category = new Types.ObjectId(category);
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

    if (status) {
      filters.status = status;
    }

    if (isDamaged) {
      filters.isDamaged = isDamaged === 'true';
    }
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
        $project: {
          softDeleted: 0,
          updatedAt: 0,
        },
      },
    ];

    const result = await this.productModel.aggregatePaginate(pipeline, {
      page,
      limit: limit > 50 ? 50 : limit,
    });
    const { docs, ...rest } = result;
    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Products fetched successfully',
    });
  }

  async findAllVendorProducts(query: GetProductsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      brand,
      category,
      isFeatured,
      isPublished,
      isNew,
      status,
      seller,
    } = query;

    const filters: QueryFilter<Product> = { softDeleted: false };

    const vendors = await this.sellerModel
      .find({ shopType: ShopType.DEFAULT })
      .select('_id');

    const sellerIds = vendors.map((s) => s._id);

    filters.seller = { $in: sellerIds };

    if (seller) {
      filters.seller = new Types.ObjectId(seller);
    }

    if (search) {
      filters.name = { $regex: search, $options: 'i' };
    }

    if (brand) {
      filters.brand = new Types.ObjectId(brand);
    }

    if (category) {
      filters.category = new Types.ObjectId(category);
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

    if (status) {
      filters.status = status;
    }

    const pipeline: PipelineStage[] = [
      {
        $match: filters,
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
        $sort: { createdAt: -1 },
      },
      {
        $project: {
          softDeleted: 0,
          updatedAt: 0,
        },
      },
    ];

    const result = await this.productModel.aggregatePaginate(pipeline, {
      page,
      limit: limit > 100 ? 100 : limit,
    });
    const { docs, ...rest } = result;

    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Products fetched successfully',
    });
  }

  async findAllProductsForDropdown(query: GetProductsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      brand,
      category,
      status,
      seller,
      isDamaged,
    } = query;

    const filters: QueryFilter<Product> = {
      softDeleted: false,
      status: PRODUCT_STATUS.APPROVED,
      isPublished: true,
      isDamaged: false,
    };

    if (seller) {
      filters.seller = new Types.ObjectId(seller);
    }

    if (search) {
      filters.name = { $regex: search, $options: 'i' };
    }

    if (brand) {
      filters.brand = new Types.ObjectId(brand);
    }

    if (category) {
      filters.category = new Types.ObjectId(category);
    }

    if (status) {
      filters.status = status;
    }

    if (isDamaged) {
      filters.isDamaged = isDamaged === 'true';
    }

    const pipeline: PipelineStage[] = [
      {
        $match: filters,
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $addFields: {
          isOffer: '$hasOffer',
        },
      },
      {
        $project: {
          thumbnail: 1,
          name: 1,
          sellingPrice: 1,
          isOffer: 1,
        },
      },
    ];

    const result = await this.productModel.aggregatePaginate(pipeline, {
      page,
      limit: limit > 50 ? 50 : limit,
    });
    const { docs, ...rest } = result;

    return apiResponse({
      data: { docs, pagination: rest },
      message: 'Products fetched successfully',
    });
  }
}
