import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOffersDto, OffersItemDto } from './dto/create-offer.dto';
import { UpdateOffersDto } from './dto/update-offer.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  Model,
  PipelineStage,
  QueryFilter,
  Types,
  type AggregatePaginateModel,
} from 'mongoose';
import { apiResponse } from 'src/common/utils/api-response';
import { GetOffersQueryDto } from './dto/get-offers-query.dto';
import { Offers, RESOURCE_TYPE } from 'src/common/models/offers&deals.schema';
import { Product } from 'src/common/models/products.schema';
import { DISCOUNT_TYPE } from 'src/common/enums/products.enum';
import { Seller } from 'src/common/models/seller.schema';
import { Category } from 'src/common/models/category.schema';
import { GetOfferItemsQueryDto } from './dto/get-offer-items-query.dto';
import { Temp } from 'src/common/models/temp.schema';
import { ComboProduct } from 'src/common/models/combo-products.schema';

@Injectable()
export class OffersService {
  constructor(
    @InjectModel(Offers.name)
    private readonly offersModel: AggregatePaginateModel<Offers>,
    @InjectModel(Product.name)
    private readonly productModel: AggregatePaginateModel<Product>,
    @InjectModel(ComboProduct.name)
    private readonly comboProductModel: AggregatePaginateModel<ComboProduct>,
    @InjectModel(Seller.name)
    private readonly sellerModel: Model<Seller>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
    @InjectModel(Temp.name)
    private readonly tempModel: Model<Temp>,
  ) {}

  async create(createOffersDto: CreateOffersDto) {
    if (createOffersDto.resourceType === RESOURCE_TYPE.CATEGORY) {
      const category = await this.categoryModel.findById(
        createOffersDto.categoryId,
      );
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    if (createOffersDto.resourceType === RESOURCE_TYPE.STORE) {
      const store = await this.sellerModel.findById(createOffersDto.sellerId);
      if (!store) {
        throw new NotFoundException('Store not found');
      }
    }

    if (createOffersDto.resourceType === RESOURCE_TYPE.FLASH_SALE) {
      const offerExists = await this.offersModel.findOne({
        resourceType: RESOURCE_TYPE.FLASH_SALE,
        softDeleted: false,
      });
      if (offerExists) {
        throw new ConflictException('Flash sale offer already exists');
      }
    }

    if (createOffersDto.resourceType === RESOURCE_TYPE.TODAYS_DEAL) {
      const offerExists = await this.offersModel.findOne({
        resourceType: RESOURCE_TYPE.TODAYS_DEAL,
        softDeleted: false,
      });
      if (offerExists) {
        throw new ConflictException("Today's deal offer already exists");
      }
    }

    createOffersDto = {
      ...createOffersDto,
      ...(createOffersDto.categoryId && {
        categoryId: new Types.ObjectId(createOffersDto.categoryId),
      }),

      ...(createOffersDto.sellerId && {
        sellerId: new Types.ObjectId(createOffersDto.sellerId),
      }),
    };
    await this.offersModel.create(createOffersDto);

    if (createOffersDto.image) {
      await this.tempModel.deleteOne({
        url: createOffersDto.image,
      });
    }
    return apiResponse({
      message: 'Offers created successfully',
    });
  }

  async findAll(query: GetOffersQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sellerId,
      status,
      sortBy = 'createdAt',
      sortOrder,
    } = query;

    const filters: QueryFilter<Offers> = { softDeleted: false };

    if (search) {
      filters.title = { $regex: search, $options: 'i' };
    }

    if (status) {
      filters.status = status === 'true';
    }

    if (sellerId) {
      filters.sellerId = new Types.ObjectId(sellerId);
    }

    const pipeline: PipelineStage[] = [
      {
        $match: filters,
      },
      {
        $sort: { createdAt: -1 },
      },
      // {
      //   $lookup: {
      //     from: 'products',
      //     localField: 'items.product',
      //     foreignField: '_id',
      //     as: 'populatedProducts',
      //     pipeline: [
      //       {
      //         $project: {
      //           name: 1,
      //           thumbnail: 1,
      //           discountType: 1,
      //           discountValue: 1,
      //           discountPrice: 1,
      //           status: 1,
      //           seller: 1,
      //         },
      //       },
      //     ],
      //   },
      // },
      {
        $lookup: {
          from: 'categories',
          foreignField: '_id',
          localField: 'categoryId',
          as: 'category',
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
          path: '$category',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'sellers',
          foreignField: '_id',
          localField: 'sellerId',
          as: 'seller',
          pipeline: [
            {
              $project: {
                name: 1,
                'store.storeName': 1,
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
        $addFields: {
          itemsCount: {
            $size: '$items',
          },
        },
      },
      // ...(seller
      //   ? [
      //       {
      //         $match: {
      //           'populatedProducts.seller': new Types.ObjectId(seller),
      //         },
      //       },
      //     ]
      //   : []),
      // {
      //   $set: {
      //     items: '$populatedProducts',
      //   },
      // },
      {
        $project: {
          softDeleted: 0,
          updatedAt: 0,
          populatedProducts: 0,
          productId: 0,
          categoryId: 0,
          sellerId: 0,
          comboProductId: 0,
          items: 0,
        },
      },
      {
        $sort: {
          [sortBy]: sortOrder === 'asc' ? 1 : -1,
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
      message: 'Offers fetched successfully',
    });
  }

  async findOfferItems(id: string, query: GetOfferItemsQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const safeLimit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * safeLimit;

    const offer = await this.offersModel.findById(id).lean();
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    const totalDocs = offer.items?.length || 0;
    const totalPages = Math.ceil(totalDocs / safeLimit) || 1;

    const pipeline: PipelineStage[] = [
      { $match: { _id: new Types.ObjectId(id) } },
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
      ...(search
        ? [
            {
              $match: {
                name: { $regex: search, $options: 'i' },
              },
            },
          ]
        : []),
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
          name: 1,
          thumbnail: 1,
          brand: 1,
          discountType: 1,
          discountValue: 1,
          discountPrice: 1,
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

  public async findById(id: string): Promise<ReturnType<typeof apiResponse>> {
    const offers = await this.offersModel.findById(id).lean();
    if (!offers) {
      throw new NotFoundException('Offers not found');
    }
    return apiResponse({
      data: offers,
      message: 'Offers fetched successfully',
    });
  }

  async update(id: string, updateOffersDto: UpdateOffersDto) {
    updateOffersDto = {
      ...updateOffersDto,
      ...(updateOffersDto.categoryId && {
        categoryId: new Types.ObjectId(updateOffersDto.categoryId),
      }),
      ...(updateOffersDto.sellerId && {
        sellerId: new Types.ObjectId(updateOffersDto.sellerId),
      }),
    };

    const updatedOffers = await this.offersModel.findByIdAndUpdate(
      id,
      updateOffersDto,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedOffers) {
      throw new NotFoundException('Offers not found');
    }
    return apiResponse({
      data: updatedOffers,
      message: 'Offers updated successfully',
    });
  }

  async remove(id: string) {
    const deletedOffers = await this.offersModel.findByIdAndUpdate(
      id,
      { softDeleted: true },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!deletedOffers) {
      throw new NotFoundException('Offers not found');
    }

    deletedOffers.items.forEach(async (item) => {
      const product = await this.productModel.findById(item.product);
      if (product) {
        product.hasDiscount = false;
        product.discountPrice = product.sellingPrice;

        if (product.variants?.length) {
          for (const variant of product.variants) {
            variant.hasDiscount = false;
            variant.discountPrice = variant.variantPrice;
          }
          product.markModified('variants');
        }
        await product.save();
      }
    });

    return apiResponse({
      status: true,
      message: 'Offers deleted successfully',
    });
  }
  async addProduct(offerId: string, productDto: OffersItemDto) {
    const session = await this.offersModel.db.startSession();
    session.startTransaction();

    try {
      const offer = await this.offersModel.findById(offerId).session(session);
      if (!offer) throw new NotFoundException('Offer not found');

      const product = await this.productModel
        .findById(productDto.product)
        .session(session);

      if (!product) {
        throw new NotFoundException('Product is not available');
      }

      //  discount calculator
      const calculateDiscountPrice = (basePrice: number): number => {
        if (productDto.discountType === DISCOUNT_TYPE.PERCENTAGE) {
          const discountAmount = (productDto.discountValue / 100) * basePrice;
          return Math.floor(basePrice - discountAmount);
        }
        return basePrice - productDto.discountValue;
      };

      const newDiscountPrice = calculateDiscountPrice(product.sellingPrice);

      // only check duplicate in SAME offer
      const isDuplicateInSameOffer = offer.items.some(
        (item: any) => item.product.toString() === product._id.toString(),
      );

      if (isDuplicateInSameOffer) {
        throw new ConflictException('Product is already in this offer');
      }

      // validation
      if (productDto.discountValue < 0) {
        throw new BadRequestException(
          'Discount value should be greater than 0',
        );
      }

      if (newDiscountPrice > product.sellingPrice) {
        throw new BadRequestException(
          'Final discount price should be less than selling price',
        );
      }

      if (newDiscountPrice < 0) {
        throw new BadRequestException(
          'Final discount price should be greater than 0',
        );
      }

      //  overwrite global product discount ALWAYS
      product.hasOffer = true;
      product.hasDiscount = true;
      product.discountType = productDto.discountType;
      product.discountValue = productDto.discountValue;
      product.discountPrice = newDiscountPrice;

      // variants update (ALSO overwrite)
      if (product.variants?.length) {
        for (const variant of product.variants) {
          const variantPrice = variant.variantPrice;

          let variantDiscountPrice: number;

          if (productDto.discountType === DISCOUNT_TYPE.PERCENTAGE) {
            const discountAmount =
              (productDto.discountValue / 100) * variantPrice;
            variantDiscountPrice = Math.floor(variantPrice - discountAmount);
          } else {
            variantDiscountPrice = variantPrice - productDto.discountValue;
          }

          variant.hasDiscount = true;
          variant.discountType = productDto.discountType;
          variant.discountValue = productDto.discountValue;
          variant.discountPrice = variantDiscountPrice;
        }

        product.markModified('variants');
      }

      await product.save({ session });

      // offer item payload
      const productPayload: OffersItemDto = {
        product: product._id,
        discountPrice: newDiscountPrice,
        discountType: productDto.discountType,
        discountValue: productDto.discountValue,
      };

      offer.items.push(productPayload);
      await offer.save({ session });

      await session.commitTransaction();

      return apiResponse({
        message: 'Product added to offer successfully (price overwritten)',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async removeProduct(offerId: string, productId: string) {
    const session = await this.offersModel.db.startSession();
    session.startTransaction();

    try {
      const offer = await this.offersModel.findById(offerId).session(session);
      if (!offer) throw new NotFoundException('Offer not found');

      const product = await this.productModel
        .findById(productId)
        .session(session);

      if (!product) throw new NotFoundException('Product is not available');

      offer.items = offer.items.filter(
        (item) => item.product.toString() !== product._id.toString(),
      );

      product.hasOffer = false;
      product.hasDiscount = false;
      product.discountPrice = product.sellingPrice;

      if (product.variants?.length) {
        for (const variant of product.variants) {
          variant.hasDiscount = false;
          variant.discountPrice = variant.variantPrice;
        }

        product.markModified('variants');
      }

      await product.save({ session });

      await offer.save({ session });

      await session.commitTransaction();

      return apiResponse({
        data: offer,
        message: 'Product removed from offer successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
